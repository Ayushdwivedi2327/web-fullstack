import React, { useEffect, useState } from "react";
import { X, Database, CheckCircle, ThumbsUp, ThumbsDown, Activity } from "lucide-react";
import { fetchStats } from "../api.js";

export function StatsModal({ isOpen, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetchStats()
      .then((data) => setStats(data.stats))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="logo-badge" style={{ width: "32px", height: "32px" }}>
              <Activity size={18} />
            </div>
            <h2 className="modal-title">System Metrics & Memory</h2>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
            Loading statistics...
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div
                style={{
                  background: "var(--bg-tertiary)",
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                  <Database size={14} /> Total Products
                </div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "4px", color: "var(--accent-primary)" }}>
                  {stats?.products || 0}
                </div>
              </div>

              <div
                style={{
                  background: "var(--bg-tertiary)",
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                  <CheckCircle size={14} /> Total Interactions
                </div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "4px", color: "var(--accent-cyan)" }}>
                  {stats?.interactions || 0}
                </div>
              </div>

              <div
                style={{
                  background: "var(--bg-tertiary)",
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                  <ThumbsUp size={14} /> Helpful Ratings
                </div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "4px", color: "var(--accent-emerald)" }}>
                  {stats?.helpful || 0}
                </div>
              </div>

              <div
                style={{
                  background: "var(--bg-tertiary)",
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                  <ThumbsDown size={14} /> Refinement Needed
                </div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "4px", color: "var(--accent-rose)" }}>
                  {stats?.notHelpful || 0}
                </div>
              </div>
            </div>

            <div
              style={{
                background: "rgba(99, 102, 241, 0.08)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                fontSize: "0.8rem",
                color: "#c7d2fe",
              }}
            >
              💡 <strong>Verified Memory:</strong> Helpful ratings trigger automatic safety evaluation and promote validated Q&A pairs into the Chroma memory collection.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
