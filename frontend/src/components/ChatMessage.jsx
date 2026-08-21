import React, { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User, ThumbsUp, ThumbsDown, ExternalLink, AlertTriangle, CheckCircle2, Bookmark } from "lucide-react";
import { submitFeedback } from "../api.js";

export function ChatMessage({ message, onSelectCitation }) {
  const isUser = message.role === "user";
  const [feedback, setFeedback] = useState(null);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleFeedback = async (helpful) => {
    if (!message.interactionId || feedbackSent) return;
    setFeedback(helpful ? "helpful" : "not_helpful");
    try {
      await submitFeedback({
        interactionId: message.interactionId,
        helpful,
      });
      setFeedbackSent(true);
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  return (
    <div className={`message-wrapper ${isUser ? "user" : "bot"}`}>
      <div className={`avatar ${isUser ? "user" : "bot"}`}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      <div className="message-bubble">
        {message.visualInfo && (
          <div
            style={{
              padding: "8px 12px",
              marginBottom: "10px",
              borderRadius: "8px",
              background: "rgba(6, 182, 212, 0.1)",
              border: "1px solid rgba(6, 182, 212, 0.25)",
              fontSize: "0.82rem",
              color: "#67e8f9",
            }}
          >
            📸 Hardware Visual Inspection Attached
          </div>
        )}

        <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>

        {/* Escalation Alert */}
        {message.escalated && (
          <div className="escalation-banner">
            <AlertTriangle size={18} />
            <span>
              This response escalated to official support channels to prevent hardware misconfiguration.
            </span>
          </div>
        )}

        {/* Citations List */}
        {message.citations && message.citations.length > 0 && (
          <div className="citations-section">
            <span className="citations-label">Grounded Sources:</span>
            {message.citations.map((cite, idx) => (
              <a
                key={idx}
                href={cite.url || "#"}
                target={cite.url ? "_blank" : "_self"}
                rel="noreferrer"
                className="citation-pill"
                onClick={(e) => {
                  if (!cite.url && onSelectCitation) {
                    e.preventDefault();
                    onSelectCitation(cite);
                  }
                }}
              >
                <Bookmark size={12} />
                <span>{cite.title}</span>
                {cite.section && <span style={{ opacity: 0.7 }}>({cite.section})</span>}
                {cite.url && <ExternalLink size={11} />}
              </a>
            ))}
          </div>
        )}

        {/* Verified Memory Feedback Row for Assistant Answers */}
        {!isUser && message.interactionId && (
          <div className="feedback-row">
            <button
              className={`btn-feedback ${feedback === "helpful" ? "active-helpful" : ""}`}
              onClick={() => handleFeedback(true)}
              disabled={feedbackSent}
              title="Helpful (promotes to verified memory vector collection)"
            >
              <ThumbsUp size={13} />
              <span>Helpful</span>
            </button>
            <button
              className={`btn-feedback ${feedback === "not_helpful" ? "active-not-helpful" : ""}`}
              onClick={() => handleFeedback(false)}
              disabled={feedbackSent}
              title="Not Helpful"
            >
              <ThumbsDown size={13} />
              <span>Not Helpful</span>
            </button>
            {feedbackSent && (
              <span style={{ fontSize: "0.75rem", color: "var(--accent-emerald)", display: "flex", alignItems: "center", gap: "4px" }}>
                <CheckCircle2 size={13} /> Memory updated
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
