import express from "express";
import { getStats } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const stats = await getStats();
    return res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (err) {
    console.error("Stats route error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
