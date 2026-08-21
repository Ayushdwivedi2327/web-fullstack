import {
  MIN_DOCUMENT_SIMILARITY,
  MIN_FAQ_SIMILARITY,
  SUPPORT_URL,
  SYSTEM_INSTRUCTIONS,
  FAQ_SYSTEM_INSTRUCTIONS,
} from "./config.js";
import {
  assessConversation,
  generateGroundedAnswer,
  generateGeneralProductAnswer,
} from "./llm.js";
import {
  queryProductDocuments,
  queryFaqDocuments,
  queryApprovedMemory,
} from "./vectorStore.js";
import { logInteraction } from "./interactions.js";

function buildProductContext({ chunks, memoryChunks = [], visualInfo = "" }) {
  const parts = [];
  if (visualInfo) {
    parts.push(`=== Visual Hardware Inspection Finding ===\n${visualInfo}`);
  }
  if (memoryChunks && memoryChunks.length > 0) {
    parts.push("=== Approved Historical Memory ===");
    for (const chunk of memoryChunks) {
      parts.push(`[Verified Prior Q&A]\n${chunk.text}`);
    }
  }
  parts.push("=== Official Product Documentation Evidence ===");
  for (const chunk of chunks) {
    const meta = chunk.metadata || {};
    parts.push(
      `[Source: ${meta.source_name || "Doc"} | section: ${meta.section || "General"} | ver: ${meta.hardware_version || "All"}]\n${chunk.text}`
    );
  }
  return parts.join("\n\n");
}

function buildFaqContext(chunks) {
  const parts = ["=== General Support FAQ Evidence ==="];
  for (const chunk of chunks) {
    const category = (chunk.metadata?.category || "general").replace(/_/g, " ");
    parts.push(`[Category: ${category}]\n${chunk.text}`);
  }
  return parts.join("\n\n");
}

function buildDocumentCitations(chunks) {
  const seen = new Set();
  const citations = [];
  for (const chunk of chunks) {
    const title = chunk.metadata?.source_name || "Product Documentation";
    const url = chunk.metadata?.source_url || "";
    const key = `${title}:${url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    citations.push({
      title,
      url,
      section: chunk.metadata?.section || null,
      source_type: "document",
      score: chunk.score,
    });
  }
  return citations.slice(0, 3);
}

function buildFaqCitations(chunks) {
  const seen = new Set();
  const citations = [];
  for (const chunk of chunks) {
    const category = (chunk.metadata?.category || "General Support").replace(/_/g, " ");
    if (seen.has(category)) continue;
    seen.add(category);
    citations.push({
      title: category.toUpperCase(),
      url: "",
      source_type: "faq",
      score: chunk.score,
    });
  }
  return citations.slice(0, 3);
}

export async function processChat({
  question,
  history = [],
  activeProduct = null,
  activeVersion = null,
  visualInfo = "",
}) {
  // 1. Conversation Assessor
  const assessment = await assessConversation({
    question,
    history,
    activeProduct,
    activeVersion,
  });

  let domain = assessment.domain;
  if (activeProduct && domain !== "general_support") {
    domain = "product_support";
  }

  // Domain: Clarification Needed (Only when no active product and no detected product)
  if (!activeProduct && !assessment.detected_product && (domain === "clarification_needed" || assessment.requires_clarification)) {
    const answer =
      assessment.clarification_prompt ||
      "Could you please specify your exact device model or hardware revision (e.g. V1 vs V2), or select a device from the left sidebar so I can give accurate instructions?";
    const interactionId = await logInteraction({
      productId: "unknown",
      productName: null,
      question,
      answer,
      citations: [],
      escalated: false,
    });

    return {
      answer,
      citations: [],
      escalated: false,
      productName: null,
      hardwareVersion: null,
      usedSearch: false,
      usedMemory: false,
      interactionId,
      clarificationNeeded: true,
    };
  }

  // Domain: General Support (FAQ)
  if (domain === "general_support") {
    const faqChunks = queryFaqDocuments({ query: question, topK: 4 });
    const topScore = faqChunks[0]?.score || 0;

    if (faqChunks.length === 0 || topScore < MIN_FAQ_SIMILARITY) {
      const answer =
        "I couldn't find a verified answer in our support FAQ. Please contact our customer support team directly for assistance with your inquiry.";
      const citations = [{ title: "Contact Customer Support", url: SUPPORT_URL, source_type: "support" }];
      const interactionId = await logInteraction({
        productId: "general",
        productName: "General Support",
        question,
        answer,
        citations,
        escalated: true,
      });

      return {
        answer,
        citations,
        escalated: true,
        productName: null,
        hardwareVersion: null,
        usedSearch: false,
        usedMemory: false,
        interactionId,
      };
    }

    const context = buildFaqContext(faqChunks);
    let answer = await generateGroundedAnswer({
      systemInstruction: FAQ_SYSTEM_INSTRUCTIONS,
      context,
      question,
    });

    if (answer.startsWith("NOT_FOUND:")) {
      const answerEscalated =
        "I couldn't verify an answer in our customer support guidelines. Please reach out to customer support directly.";
      const citations = [{ title: "Contact Customer Support", url: SUPPORT_URL, source_type: "support" }];
      const interactionId = await logInteraction({
        productId: "general",
        productName: "General Support",
        question,
        answer: answerEscalated,
        citations,
        escalated: true,
      });

      return {
        answer: answerEscalated,
        citations,
        escalated: true,
        productName: null,
        hardwareVersion: null,
        usedSearch: false,
        usedMemory: false,
        interactionId,
      };
    }

    const citations = buildFaqCitations(faqChunks);
    const interactionId = await logInteraction({
      productId: "general",
      productName: "General Support",
      question,
      answer,
      citations,
      escalated: false,
    });

    return {
      answer,
      citations,
      escalated: false,
      productName: "General Support",
      hardwareVersion: null,
      usedSearch: false,
      usedMemory: false,
      interactionId,
    };
  }

  // Domain: Product Support
  let effectiveProduct = activeProduct || assessment.detected_product || "";
  const effectiveVersion = activeVersion || assessment.detected_version || "";

  console.log(`[ChatService] Querying for product: "${effectiveProduct}", version: "${effectiveVersion}", query: "${question}"`);

  const docChunks = queryProductDocuments({
    query: question,
    productId: effectiveProduct,
    hardwareVersion: effectiveVersion,
    topK: 5,
  });

  console.log(`[ChatService] Retrieved ${docChunks.length} chunks for "${effectiveProduct}"`);

  if (!effectiveProduct && docChunks.length > 0) {
    effectiveProduct = docChunks[0].metadata.product_id;
  }

  const memoryChunks = effectiveProduct
    ? queryApprovedMemory({ query: question, productId: effectiveProduct, topK: 2 })
    : [];

  // If no document chunks found at all for the specified product, answer using LLM official & manufacturer knowledge
  if (docChunks.length === 0 && memoryChunks.length === 0 && !visualInfo) {
    const rawAnswer = await generateGeneralProductAnswer({
      question,
      product: effectiveProduct,
      version: effectiveVersion,
      history,
    });

    const displayName = (effectiveProduct || "Official Product Knowledge").toUpperCase();
    const citations = [
      {
        title: `${displayName} — Official Manufacturer Knowledge`,
        url: SUPPORT_URL,
        source_type: "general_knowledge",
        score: 0.95,
      },
    ];

    const interactionId = await logInteraction({
      productId: effectiveProduct || "general_knowledge",
      productName: effectiveProduct,
      question,
      answer: rawAnswer,
      citations,
      escalated: false,
    });

    return {
      answer: rawAnswer,
      citations,
      escalated: false,
      productName: effectiveProduct,
      hardwareVersion: effectiveVersion,
      usedSearch: true,
      usedMemory: false,
      interactionId,
    };
  }

  const context = buildProductContext({
    chunks: docChunks,
    memoryChunks,
    visualInfo,
  });

  let rawAnswer = await generateGroundedAnswer({
    systemInstruction: SYSTEM_INSTRUCTIONS,
    context,
    question,
  });

  console.log(`[ChatService] Raw LLM Answer: ${rawAnswer.slice(0, 100)}...`);

  if (rawAnswer.startsWith("NOT_FOUND:")) {
    // If not found in specific PDF chunk, synthesize using general official knowledge
    rawAnswer = await generateGeneralProductAnswer({
      question,
      product: effectiveProduct,
      version: effectiveVersion,
      history,
    });
  }

  const citations = buildDocumentCitations(docChunks);
  const interactionId = await logInteraction({
    productId: effectiveProduct,
    productName: effectiveProduct,
    question,
    answer: rawAnswer,
    citations,
    escalated: false,
  });

  return {
    answer: rawAnswer,
    citations,
    escalated: false,
    productName: effectiveProduct,
    hardwareVersion: effectiveVersion,
    usedSearch: false,
    usedMemory: memoryChunks.length > 0,
    interactionId,
  };
}
