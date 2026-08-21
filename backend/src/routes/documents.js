import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createRequire } from "module";
import { v4 as uuidv4 } from "uuid";
import { DATA_DIR } from "../config.js";
import { chunkAndIndexDocument } from "../vectorStore.js";
import { getDb } from "../db.js";

const require = createRequire(import.meta.url);
const pdfModule = require("pdf-parse");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } });

async function extractTextFromPdfBuffer(buffer) {
  try {
    if (pdfModule.PDFParse) {
      const parser = new pdfModule.PDFParse({ data: buffer });
      const res = await parser.getText();
      await parser.destroy();
      return typeof res === "string" ? res : res.text || "";
    } else if (typeof pdfModule === "function") {
      const res = await pdfModule(buffer);
      return res.text || "";
    }
  } catch (err) {
    console.error("PDF Parsing error:", err);
    throw new Error(`Failed to parse PDF: ${err.message}`);
  }
  return "";
}

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const {
      productId: rawProductId,
      productName,
      manufacturer = "General",
      model = "",
      hardwareVersion = "",
    } = req.body;

    const productId = (
      rawProductId ||
      (productName ? productName.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "custom-product")
    ).replace(/-+$/, "");

    let extractedText = "";

    if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
      extractedText = await extractTextFromPdfBuffer(file.buffer);
    } else {
      extractedText = file.buffer.toString("utf-8");
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return res.status(400).json({ error: "Failed to extract readable text from document." });
    }

    // Save to disk in data/products/<productId>/
    const productDir = path.join(DATA_DIR, "products", productId);
    if (!fs.existsSync(productDir)) {
      fs.mkdirSync(productDir, { recursive: true });
    }
    const savePath = path.join(productDir, file.originalname);
    fs.writeFileSync(savePath, file.buffer);

    // Save markdown text version as well
    const textSavePath = path.join(productDir, `${path.parse(file.originalname).name}.txt`);
    fs.writeFileSync(textSavePath, extractedText);

    // Chunk and index into vector store live
    chunkAndIndexDocument(productId, file.originalname, extractedText, hardwareVersion);

    // Save product & document record in SQLite DB
    const db = getDb();
    const now = new Date().toISOString();
    const docId = uuidv4();

    db.run(
      `INSERT OR IGNORE INTO products (id, name, manufacturer, model, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [productId, productName || productId, manufacturer, model, "", now, now],
      (err) => {
        if (err) console.warn("Product insert warning:", err.message);
      }
    );

    db.run(
      `INSERT INTO documents (id, product_id, filename, file_path, source_url, source_type, total_chunks, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [docId, productId, file.originalname, savePath, "", "manual_pdf", 1, "INDEXED", now, now],
      (err) => {
        if (err) console.warn("Document insert warning:", err.message);
      }
    );

    return res.json({
      success: true,
      message: `Document '${file.originalname}' successfully indexed into vector database!`,
      productId,
      hardwareVersion,
      extractedCharacters: extractedText.length,
    });
  } catch (err) {
    console.error("Document upload error:", err);
    return res.status(500).json({ error: err.message || "Failed to process document" });
  }
});

router.get("/", async (req, res) => {
  try {
    const db = getDb();
    db.all(
      `SELECT d.*, p.name as product_name FROM documents d LEFT JOIN products p ON d.product_id = p.id ORDER BY d.created_at DESC`,
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        return res.json({ documents: rows || [] });
      }
    );
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
