import {
  GROK_API_KEY,
  GROK_API_BASE,
  GROK_GENERATION_MODEL,
  GROK_SEARCH_MODEL,
  GROK_VISION_MODEL,
} from "./config.js";

async function callWithRetry(fn, maxRetries = 2, initialDelay = 1500) {
  let delay = initialDelay;
  let lastExc = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastExc = err;
      const errMsg = (err.message || "").toLowerCase();
      const isRateLimit = errMsg.includes("429") || errMsg.includes("rate") || errMsg.includes("quota");
      const isTransient =
        errMsg.includes("503") ||
        errMsg.includes("500") ||
        errMsg.includes("502") ||
        errMsg.includes("504") ||
        errMsg.includes("timeout") ||
        errMsg.includes("econnreset");

      if ((isRateLimit || isTransient) && attempt < maxRetries) {
        console.warn(`Transient API condition (${errMsg.slice(0, 60)}). Waiting ${(delay / 1000).toFixed(1)}s (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.min(delay * 2, 6000);
      } else {
        throw lastExc;
      }
    }
  }
}

export async function chatCompletion({
  messages,
  temperature = 0.0,
  model = GROK_GENERATION_MODEL,
  responseFormat = null,
}) {
  if (!GROK_API_KEY) {
    throw new Error("GROK_API_KEY / GROQ_API_KEY is not configured. Please check your .env file.");
  }

  const payload = {
    model,
    messages,
    temperature,
  };

  if (responseFormat) {
    payload.response_format = responseFormat;
  }

  return await callWithRetry(async () => {
    const res = await fetch(`${GROK_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      // If 429 on current model, try instant fallback models
      if (res.status === 429) {
        const fallbackModel = payload.model === "openai/gpt-oss-20b" ? "qwen/qwen3.6-27b" : "openai/gpt-oss-20b";
        console.warn(`429 Rate limit on ${payload.model}. Falling back to ${fallbackModel}...`);
        payload.model = fallbackModel;
        const fbRes = await fetch(`${GROK_API_BASE}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROK_API_KEY}`,
          },
          body: JSON.stringify(payload),
        });
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          const text = fbData.choices?.[0]?.message?.content || "";
          return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
        }
      }
      throw new Error(`LLM API Error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  });
}

/**
 * Perform domain classification & intent routing
 */
export async function assessConversation({ question, history = [], activeProduct = null, activeVersion = null }) {
  const systemPrompt = `You are a conversation assessor for a technical product and general customer support system.
Analyze the user's latest question and conversation context. Output ONLY valid JSON:
{
  "domain": "product_support" | "general_support" | "clarification_needed",
  "category": "hardware" | "network" | "returns" | "orders" | "account" | "shipping" | "general",
  "detected_product": string or null,
  "detected_version": string or null,
  "requires_clarification": boolean,
  "clarification_prompt": string or null
}

Rules:
1. HIGHEST PRIORITY: If the user's question is about orders, returns, refunds, shipping, cancellations, payments, account management, or company FAQs -> ALWAYS classify domain as "general_support", even if an Active Context Product is set.
2. For hardware troubleshooting, device setup, buttons, specifications, or device features:
   - If Active Context Product is set -> classify as "product_support" and "requires_clarification": false.
   - If no Active Context is set but user names a device -> "product_support", "detected_product": <device name>.
   - If no product is set and no device is named -> "clarification_needed", "requires_clarification": true.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-4),
    {
      role: "user",
      content: `Active Context: Product="${activeProduct || "None"}", Version="${activeVersion || "None"}"\nUser Question: ${question}`,
    },
  ];

  try {
    const raw = await chatCompletion({
      messages,
      temperature: 0.1,
      responseFormat: { type: "json_object" },
    });
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Assessor JSON parse fallback:", err.message);
    // Simple heuristic fallback
    const qLower = question.toLowerCase();
    const isGeneral =
      qLower.includes("return") ||
      qLower.includes("refund") ||
      qLower.includes("order") ||
      qLower.includes("shipping") ||
      qLower.includes("account") ||
      qLower.includes("cancel") ||
      qLower.includes("delivery");

    return {
      domain: isGeneral ? "general_support" : "product_support",
      category: isGeneral ? "returns" : "hardware",
      detected_product: activeProduct,
      detected_version: activeVersion,
      requires_clarification: false,
      clarification_prompt: null,
    };
  }
}

/**
 * Generate grounded answer using strict evidence instructions
 */
export async function generateGroundedAnswer({ systemInstruction, context, question }) {
  const prompt = `${context}\n\n=== User Question ===\n${question}\n\nAnswer concisely based ONLY on the evidence above:`;
  const messages = [
    { role: "system", content: systemInstruction },
    { role: "user", content: prompt },
  ];

  return await chatCompletion({
    messages,
    temperature: 0.0,
  });
}

/**
 * Vision Model Inspection: Analyzes images of routers, labels, or error lights
 */
export async function inspectHardwareImage({ imageBase64, mimeType = "image/jpeg", prompt = "Analyze this hardware label or device condition." }) {
  const messages = [
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${imageBase64}`,
          },
        },
      ],
    },
  ];

  return await chatCompletion({
    messages,
    model: GROK_VISION_MODEL,
    temperature: 0.1,
  });
}

export async function generateGeneralProductAnswer({ question, product = "", version = "", history = [] }) {
  const pLabel = product ? `"${product}"` : "the user's device/product";
  const vLabel = version ? ` (version ${version})` : "";
  const systemInstruction = `You are an expert technical product support assistant.
The user is asking a troubleshooting, configuration, or setup question about ${pLabel}${vLabel}.
Provide comprehensive, accurate, step-by-step instructions based on verified official manufacturer standards and specifications.
Structure your response clearly with headings or numbered steps.`;

  const messages = [
    { role: "system", content: systemInstruction },
    ...history.slice(-4),
    { role: "user", content: question },
  ];

  return await chatCompletion({
    messages,
    temperature: 0.2,
  });
}

