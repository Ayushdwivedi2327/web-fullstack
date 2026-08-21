import express from "express";
import cors from "cors";
import { PORT } from "./config.js";
import { loadAndIndexAll } from "./vectorStore.js";
import { initSchema } from "./db.js";

import chatRouter from "./routes/chat.js";
import devicesRouter from "./routes/devices.js";
import feedbackRouter from "./routes/feedback.js";
import visionRouter from "./routes/vision.js";
import statsRouter from "./routes/stats.js";
import documentsRouter from "./routes/documents.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Routes
app.use("/api/chat", chatRouter);
app.use("/api/devices", devicesRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/vision", visionRouter);
app.use("/api/stats", statsRouter);
app.use("/api/documents", documentsRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Intelligent Product Support API" });
});

async function start() {
  try {
    await initSchema();
    await loadAndIndexAll();

    app.listen(PORT, () => {
      console.log(`🚀 Node.js Backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
