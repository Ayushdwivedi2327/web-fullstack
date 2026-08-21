import express from "express";
import { submitFeedback } from "../interactions.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { interactionId, helpful, feedbackText } = req.body;

    if (!interactionId || typeof helpful !== "boolean") {
      return res.status(400).json({ error: "Missing interactionId or helpful status" });
    }

    const success = await submitFeedback({
      interactionId,
      helpful,
      feedbackText: feedbackText || "",
    });

    return res.json({
      success,
      message: helpful
        ? "Thank you! Interaction has been validated and queued for verified memory."
        : "Thank you for your feedback. We will refine future answers.",
    });
  } catch (err) {
    console.error("Feedback route error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
