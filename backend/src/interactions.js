import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { INTERACTIONS_FILE } from "./config.js";
import { recordInteraction, recordRating } from "./db.js";
import { addApprovedMemory } from "./vectorStore.js";

const SUSPICIOUS_PATTERNS = [
  /ignore (?:all )?previous instructions/i,
  /system prompt/i,
  /<script[\s>]/i,
  /javascript:/i,
  /eval\(/i,
  /drop table/i,
];

function isSafeForMemory(question, answer, citations) {
  if (!answer || answer.trim().length < 20) return false;
  if (!citations || citations.length === 0) return false;

  const combined = `${question} ${answer}`;
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(combined)) return false;
  }
  return true;
}

export async function logInteraction({
  productId,
  productName,
  question,
  answer,
  citations = [],
  escalated = false,
  usedSearch = false,
}) {
  const id = uuidv4();
  const row = {
    id,
    created_at: new Date().toISOString(),
    product_id: productId,
    product_name: productName,
    question,
    answer,
    citations,
    escalated,
    used_search: usedSearch,
    feedback: null,
    review_status: "pending",
  };

  // Write to JSONL audit log
  try {
    fs.appendFileSync(INTERACTIONS_FILE, JSON.stringify(row) + "\n", "utf-8");
  } catch (err) {
    console.warn("Failed to append to interactions.jsonl:", err.message);
  }

  // Save to SQLite
  try {
    await recordInteraction({
      id,
      productId,
      productName,
      question,
      answer,
      citations,
      escalated,
      usedSearch,
    });
  } catch (err) {
    console.warn("Failed to write interaction to SQLite:", err.message);
  }

  return id;
}

export async function submitFeedback({ interactionId, helpful, feedbackText = "" }) {
  const ratingId = uuidv4();
  const ratingStr = helpful ? "helpful" : "not_helpful";

  // Record to SQLite
  await recordRating(ratingId, interactionId, ratingStr, feedbackText);

  // Read interactions JSONL and update
  if (!fs.existsSync(INTERACTIONS_FILE)) return false;

  const lines = fs.readFileSync(INTERACTIONS_FILE, "utf-8").split("\n").filter((l) => l.trim());
  let targetRow = null;

  const updatedLines = lines.map((line) => {
    try {
      const row = JSON.parse(line);
      if (row.id === interactionId) {
        row.feedback = ratingStr;
        if (helpful && !row.escalated && isSafeForMemory(row.question, row.answer, row.citations)) {
          row.review_status = "approved";
          // Promote into persistent retrieval memory
          addApprovedMemory({
            productId: row.product_id || "general",
            question: row.question,
            answer: row.answer,
            url: row.citations?.[0]?.url || "",
          });
        }
        targetRow = row;
        return JSON.stringify(row);
      }
      return line;
    } catch (e) {
      return line;
    }
  });

  fs.writeFileSync(INTERACTIONS_FILE, updatedLines.join("\n") + "\n", "utf-8");
  return !!targetRow;
}
