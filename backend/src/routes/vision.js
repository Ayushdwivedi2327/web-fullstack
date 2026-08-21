import express from "express";
import { inspectHardwareImage } from "../llm.js";

const router = express.Router();

router.post("/inspect", async (req, res) => {
  try {
    const { imageBase64, mimeType, prompt } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 data" });
    }

    const finding = await inspectHardwareImage({
      imageBase64,
      mimeType: mimeType || "image/jpeg",
      prompt: prompt || "Identify the product model, hardware version, serial/MAC, and LED indicator status from this device image.",
    });

    return res.json({ finding });
  } catch (err) {
    console.error("Vision route error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
