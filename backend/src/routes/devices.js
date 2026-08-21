import express from "express";
import fs from "fs";
import path from "path";
import { DATA_DIR } from "../config.js";
import { getAllProducts } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const dbProducts = await getAllProducts();
    const productsDir = path.join(DATA_DIR, "products");
    const deviceList = [];

    if (fs.existsSync(productsDir)) {
      const entries = fs.readdirSync(productsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const folder = path.join(productsDir, entry.name);
          const files = fs.readdirSync(folder);
          const versions = new Set();

          // Scan files for version indicators
          for (const file of files) {
            if (file.endsWith(".md") || file.endsWith(".txt")) {
              const content = fs.readFileSync(path.join(folder, file), "utf-8");
              const matches = content.match(/\b(?:V|Version|Rev)\s*([0-9]+(?:\.[0-9]+)?)/gi) || [];
              matches.forEach((m) => {
                const num = m.replace(/[^0-9.]/g, "");
                if (num) versions.add(`V${num}`);
              });
            }
          }

          const dbMatch = dbProducts.find((p) => p.id === entry.name);
          deviceList.push({
            id: entry.name,
            name: dbMatch?.name || entry.name.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            filesCount: files.length,
            hardwareVersions: Array.from(versions).sort(),
          });
        }
      }
    }

    return res.json({
      devices: deviceList,
      dbProducts,
    });
  } catch (err) {
    console.error("Devices route error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
