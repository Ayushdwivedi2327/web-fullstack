import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";
import { DB_PATH, DATA_DIR } from "./config.js";

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let dbInstance = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error("Failed to connect to SQLite database:", err.message);
      }
    });

    dbInstance.run("PRAGMA journal_mode = WAL;");
    dbInstance.run("PRAGMA foreign_keys = ON;");
    initSchema();
  }
  return dbInstance;
}

function runAsync(sql, params = []) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function allAsync(sql, params = []) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function getAsync(sql, params = []) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export async function initSchema() {
  const db = getDb();
  const schema = `
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      manufacturer TEXT,
      model TEXT,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_path TEXT,
      source_url TEXT,
      source_type TEXT,
      total_chunks INTEGER DEFAULT 0,
      status TEXT DEFAULT 'INDEXED',
      created_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS interactions (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      product_name TEXT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      citations_json TEXT,
      escalated INTEGER DEFAULT 0,
      used_search INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      interaction_id TEXT NOT NULL,
      rating TEXT NOT NULL,
      feedback_text TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE CASCADE
    );
  `;
  db.exec(schema, (err) => {
    if (err) console.error("Error creating tables:", err.message);
  });
}

export async function getAllProducts() {
  return await allAsync("SELECT * FROM products ORDER BY name ASC");
}

export async function recordInteraction({
  id,
  productId,
  productName,
  question,
  answer,
  citations,
  escalated,
  usedSearch,
}) {
  const now = new Date().toISOString();
  await runAsync(
    `INSERT OR REPLACE INTO interactions (id, product_id, product_name, question, answer, citations_json, escalated, used_search, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      productId || null,
      productName || null,
      question,
      answer,
      JSON.stringify(citations || []),
      escalated ? 1 : 0,
      usedSearch ? 1 : 0,
      now,
    ]
  );
}

export async function recordRating(id, interactionId, rating, feedbackText = "") {
  const now = new Date().toISOString();
  await runAsync(
    `INSERT INTO ratings (id, interaction_id, rating, feedback_text, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, interactionId, rating, feedbackText, now]
  );
}

export async function getStats() {
  const productsCount = await getAsync("SELECT COUNT(*) as count FROM products");
  const interactionsCount = await getAsync("SELECT COUNT(*) as count FROM interactions");
  const helpfulCount = await getAsync("SELECT COUNT(*) as count FROM ratings WHERE rating = 'helpful'");
  const notHelpfulCount = await getAsync("SELECT COUNT(*) as count FROM ratings WHERE rating = 'not_helpful'");

  return {
    products: productsCount?.count || 0,
    interactions: interactionsCount?.count || 0,
    helpful: helpfulCount?.count || 0,
    notHelpful: notHelpfulCount?.count || 0,
  };
}
