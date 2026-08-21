import express from "express";
import { processChat } from "../chatService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { question, history, activeProduct, activeVersion, visualInfo } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Missing or invalid question parameter" });
    }

    const result = await processChat({
      question: question.trim(),
      history: Array.isArray(history) ? history : [],
      activeProduct: activeProduct || null,
      activeVersion: activeVersion || null,
      visualInfo: visualInfo || "",
    });

    return res.json(result);
  } catch (err) {
    console.error("Chat route error:", err);
    return res.status(500).json({
      error: err.message || "Internal Server Error in Chat Service",
      answer: "An internal error occurred while processing your request. Please try again.",
      citations: [],
      escalated: true,
    });
  }
});

export default router;
