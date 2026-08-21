import crypto from "crypto";
import fs from "fs";
import path from "path";
import { DATA_DIR } from "./config.js";

const EMBEDDING_DIMENSIONS = 768;

/**
 * Deterministic normalized dense embedding matching the Python implementation
 */
export function getEmbedding(text, dim = EMBEDDING_DIMENSIONS) {
  const vec = new Float64Array(dim);
  const words = (text || "").toLowerCase().match(/\w+/g) || [];
  if (words.length === 0) return Array.from(vec);

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    // 1-gram hash
    const h1Hex = crypto.createHash("sha256").update(w).digest("hex").slice(0, 16);
    const h1 = BigInt("0x" + h1Hex);
    const idx1 = Number(h1 % BigInt(dim));
    const sign1 = (h1 >> 16n) & 1n ? 1.0 : -1.0;
    vec[idx1] += sign1 * 1.0;

    // 2-gram context hash
    if (i + 1 < words.length) {
      const bigram = `${w}_${words[i + 1]}`;
      const h2Hex = crypto.createHash("sha256").update(bigram).digest("hex").slice(0, 16);
      const h2 = BigInt("0x" + h2Hex);
      const idx2 = Number(h2 % BigInt(dim));
      const sign2 = (h2 >> 16n) & 1n ? 1.0 : -1.0;
      vec[idx2] += sign2 * 1.5;
    }
  }

  let sumSq = 0;
  for (let i = 0; i < dim; i++) {
    sumSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      vec[i] /= norm;
    }
  }

  return Array.from(vec);
}

function cosineSimilarity(vecA, vecB) {
  let dot = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
  }
  return dot;
}

// In-memory store cached from data directories
export let productDocuments = []; // Array of { id, text, embedding, metadata: { product_id, product_name, hardware_version, source_name, section, page } }
export let faqDocuments = [];      // Array of { id, text, embedding, metadata: { category, question, answer } }
export let approvedMemory = [];    // Array of { id, text, embedding, metadata: { product_id, question, answer, url } }

export async function loadAndIndexAll() {
  console.log("Indexing product documentation and FAQs in Node.js vector store...");
  productDocuments = [];
  faqDocuments = [];

  // 1. Index products from data/products
  const productsDir = path.join(DATA_DIR, "products");
  if (fs.existsSync(productsDir)) {
    const entries = fs.readdirSync(productsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const productFolder = path.join(productsDir, entry.name);
        const files = fs.readdirSync(productFolder);
        for (const file of files) {
          if (file.endsWith(".md") || file.endsWith(".txt")) {
            const filePath = path.join(productFolder, file);
            const content = fs.readFileSync(filePath, "utf-8");
            chunkAndIndexDocument(entry.name, file, content);
          }
        }
      }
    }
  }

  // 2. Index FAQ files
  const faqDir = path.join(DATA_DIR, "faq");
  if (fs.existsSync(faqDir)) {
    const files = fs.readdirSync(faqDir);
    for (const file of files) {
      if (file.endsWith(".json") || file.endsWith(".jsonl")) {
        const filePath = path.join(faqDir, file);
        const raw = fs.readFileSync(filePath, "utf-8");
        if (file.endsWith(".jsonl")) {
          const lines = raw.split("\n").filter((l) => l.trim());
          for (const line of lines) {
            try {
              const item = JSON.parse(line);
              indexFaqItem(item);
            } catch (e) {}
          }
        } else {
          try {
            const items = JSON.parse(raw);
            if (Array.isArray(items)) {
              items.forEach(indexFaqItem);
            }
          } catch (e) {}
        }
      }
    }
  }

  // Fallback default FAQs if empty
  if (faqDocuments.length === 0) {
    const defaultFaqs = [
      { category: "returns", question: "What is your return policy?", answer: "Items can be returned within 30 days of receipt in original packaging for a full refund." },
      { category: "shipping", question: "How long does standard shipping take?", answer: "Standard shipping typically takes 3-5 business days across the continental US." },
      { category: "orders", question: "How do I cancel my order?", answer: "You can cancel your order within 1 hour of placing it from your account order management page." },
      { category: "warranty", question: "What is the hardware warranty period?", answer: "All hardware devices include a 1-year standard manufacturer limited warranty." },
    ];
    defaultFaqs.forEach(indexFaqItem);
  }

  console.log(`Node Vector Store ready: ${productDocuments.length} product chunks, ${faqDocuments.length} FAQs indexed.`);
}

function chunkText(text, maxWords = 220, overlapWords = 35) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  if (words.length <= maxWords) return [text.trim()];
  const chunks = [];
  const step = maxWords - overlapWords;
  for (let start = 0; start < words.length; start += step) {
    const chunkWords = words.slice(start, start + maxWords);
    if (chunkWords.length > 0) {
      chunks.push(chunkWords.join(" "));
    }
    if (start + maxWords >= words.length) break;
  }
  return chunks;
}

export function chunkAndIndexDocument(productId, filename, content, customHwVersion = "") {
  // Break entire document into sequential sliding window chunks
  const cleanContent = (content || "").replace(/\r\n/g, "\n");
  const subChunks = chunkText(cleanContent, 220, 35);
  let chunkIdx = 0;

  let docHwVersion = customHwVersion || "";
  if (!docHwVersion) {
    const verMatch = cleanContent.slice(0, 3000).match(/\b(?:V|Version|Rev|Revision)\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (verMatch) {
      docHwVersion = `V${verMatch[1]}`;
    }
  }

  for (const chunk of subChunks) {
    const trimmed = chunk.trim();
    if (!trimmed || trimmed.length < 15) continue;

    // Detect first line or heading for section name
    const lines = trimmed.split("\n").filter((l) => l.trim());
    const firstLine = lines[0] ? lines[0].replace(/^#+\s*/, "").slice(0, 60).trim() : "General";

    const embedding = getEmbedding(trimmed);
    productDocuments.push({
      id: `${productId}-${filename}-${chunkIdx++}`,
      text: trimmed,
      embedding,
      metadata: {
        product_id: productId,
        product_name: productId.replace(/-/g, " ").toUpperCase(),
        hardware_version: docHwVersion,
        source_name: filename,
        section: firstLine || "Product Manual",
        page: "",
        source_url: "",
      },
    });
  }
}

function indexFaqItem(item) {
  const q = item.question || item.query || item.q || "";
  const a = item.answer || item.response || item.a || "";
  if (!q || !a) return;

  const combined = `Question: ${q}\nAnswer: ${a}`;
  faqDocuments.push({
    id: `faq-${faqDocuments.length}`,
    text: combined,
    embedding: getEmbedding(combined),
    metadata: {
      category: item.category || item.intent || "general",
      question: q,
      answer: a,
    },
  });
}

export function queryProductDocuments({ query, productId, hardwareVersion = "", topK = 6 }) {
  const queryVec = getEmbedding(query);
  const queryWords = new Set((query || "").toLowerCase().match(/\w+/g) || []);
  const targetPid = (productId || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
  let candidateChunks = [];

  for (const doc of productDocuments) {
    // Case-insensitive and slug-tolerant product matching
    if (targetPid) {
      const docPid = (doc.metadata.product_id || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
      if (docPid !== targetPid && !docPid.includes(targetPid) && !targetPid.includes(docPid)) {
        continue;
      }
    }

    // Only filter by hardware version if BOTH query and doc specify incompatible versions
    if (
      hardwareVersion &&
      doc.metadata.hardware_version &&
      doc.metadata.hardware_version.toLowerCase() !== hardwareVersion.toLowerCase()
    ) {
      continue;
    }

    const cosine = cosineSimilarity(queryVec, doc.embedding);
    
    // Keyword match boost
    let matchCount = 0;
    const docTextLower = doc.text.toLowerCase();
    for (const w of queryWords) {
      if (w.length > 2 && docTextLower.includes(w)) {
        matchCount++;
      }
    }
    const keywordBoost = Math.min(0.35, matchCount * 0.06);
    const score = Math.max(0.0, cosine + keywordBoost);

    candidateChunks.push({
      text: doc.text,
      metadata: doc.metadata,
      score,
    });
  }

  candidateChunks.sort((a, b) => b.score - a.score);

  // If no explicit productId was requested, isolate to the single best matching product
  if (!targetPid && candidateChunks.length > 0) {
    const dominantProduct = candidateChunks[0].metadata.product_id;
    candidateChunks = candidateChunks.filter(
      (c) => c.metadata.product_id === dominantProduct
    );
  }

  // On broad/overview queries for an active product, ensure the top overview/first 2 chunks are included
  if (targetPid) {
    const productChunks = productDocuments.filter((d) => {
      const p = (d.metadata.product_id || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
      return p === targetPid || p.includes(targetPid) || targetPid.includes(p);
    });
    if (productChunks.length > 0) {
      const topIntroChunks = productChunks.slice(0, 2);
      for (const intro of topIntroChunks) {
        if (!candidateChunks.some((c) => c.text === intro.text)) {
          candidateChunks.unshift({
            text: intro.text,
            metadata: intro.metadata,
            score: 0.5,
          });
        }
      }
    }
  }

  return candidateChunks.slice(0, topK);
}

export function queryFaqDocuments({ query, topK = 4 }) {
  const queryVec = getEmbedding(query);
  const queryWords = new Set((query || "").toLowerCase().match(/\w+/g) || []);
  const results = [];

  for (const doc of faqDocuments) {
    const cosine = cosineSimilarity(queryVec, doc.embedding);
    
    // Keyword match boost
    let matchCount = 0;
    const docTextLower = doc.text.toLowerCase();
    for (const w of queryWords) {
      if (w.length > 2 && docTextLower.includes(w)) {
        matchCount++;
      }
    }
    const keywordBoost = Math.min(0.35, matchCount * 0.08);
    const score = Math.max(0.0, cosine + keywordBoost);

    results.push({
      text: doc.text,
      metadata: doc.metadata,
      score,
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}

export function queryApprovedMemory({ query, productId, topK = 2 }) {
  const queryVec = getEmbedding(query);
  const results = [];

  for (const doc of approvedMemory) {
    if (productId && doc.metadata.product_id !== productId) continue;
    const score = cosineSimilarity(queryVec, doc.embedding);
    results.push({
      text: doc.text,
      metadata: doc.metadata,
      score: Math.max(0.0, score),
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}

export function addApprovedMemory({ productId, question, answer, url = "" }) {
  const text = `Q: ${question}\nA: ${answer}`;
  approvedMemory.push({
    id: `mem-${Date.now()}`,
    text,
    embedding: getEmbedding(text),
    metadata: {
      product_id: productId,
      question,
      answer,
      url,
    },
  });
}
