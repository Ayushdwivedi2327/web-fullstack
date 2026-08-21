import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import fs from "fs";

// Try loading .env from web-fullstack/backend, then from root
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const PORT = process.env.PORT || 5000;
export const DATA_DIR = fs.existsSync(path.resolve(__dirname, "../data"))
  ? path.resolve(__dirname, "../data")
  : path.resolve(__dirname, "../../../data");
export const DB_PATH = path.join(DATA_DIR, "assistant.db");
export const INTERACTIONS_FILE = path.join(DATA_DIR, "interactions.jsonl");

// API Keys
export const GROK_API_KEY =
  process.env.GROK_API_KEY ||
  process.env.GROQ_API_KEY ||
  process.env.XAI_API_KEY ||
  "";

export const GROK_API_BASE = (() => {
  const explicit = (process.env.GROK_API_BASE || "").trim();
  if (explicit && explicit !== "https://api.x.ai/v1") return explicit.replace(/\/$/, "");
  if (GROK_API_KEY.startsWith("gsk_")) return "https://api.groq.com/openai/v1";
  return (process.env.GROK_API_BASE || "https://api.x.ai/v1").replace(/\/$/, "");
})();

// Models
export const GROK_GENERATION_MODEL =
  process.env.GROK_GENERATION_MODEL ||
  (GROK_API_KEY.startsWith("gsk_") ? "llama-3.3-70b-versatile" : "grok-2-latest");

export const GROK_SEARCH_MODEL =
  process.env.GROK_SEARCH_MODEL ||
  (GROK_API_KEY.startsWith("gsk_") ? "llama-3.3-70b-versatile" : "grok-2-latest");

export const GROK_VISION_MODEL =
  process.env.GROK_VISION_MODEL ||
  (GROK_API_KEY.startsWith("gsk_") ? "llama-3.2-11b-vision-preview" : "grok-2-vision-1212");

// Thresholds
export const MIN_DOCUMENT_SIMILARITY = parseFloat(process.env.MIN_DOCUMENT_SIMILARITY || "0.42");
export const MIN_FAQ_SIMILARITY = 0.25;
export const MIN_MEMORY_SIMILARITY = 0.50;
export const RETRIEVAL_TOP_K = parseInt(process.env.RETRIEVAL_TOP_K || "5", 10);
export const SUPPORT_URL = "https://www.tp-link.com/us/support/contact-technical-support/";

export const SYSTEM_INSTRUCTIONS = `You are an expert technical product support assistant.
Answer the user's inquiry thoroughly, helpfully, and accurately using the provided documentation evidence.
Synthesize relevant details, specifications, overview information, troubleshooting steps, and guidance found in the document.
If the user asks a broad or conversational question like "describe it", "what is this", "tell me about it", or "overview", provide a structured summary of the product, its key features, specifications, and functions based on the evidence.
Never invent procedures, reset steps, or specifications not mentioned in the documentation.
Cite the source title or section when answering.`;

export const FAQ_SYSTEM_INSTRUCTIONS = `You are a helpful customer support assistant.
Answer using the provided FAQ evidence clearly and concisely.
Synthesize the return policies, shipping deadlines, or order procedures found in the evidence.`;

