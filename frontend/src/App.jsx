import React, { useState, useEffect, useRef } from "react";
import { Send, Camera, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { ChatMessage } from "./components/ChatMessage";
import { VisionModal } from "./components/VisionModal";
import { StatsModal } from "./components/StatsModal";
import { DocumentUploadModal } from "./components/DocumentUploadModal";
import { fetchDevices, sendChatMessage } from "./api";
import { FileUp } from "lucide-react";

export function App() {
  const [devices, setDevices] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("");
  
  const [messages, setMessages] = useState([
    {
      role: "bot",
      content:
        "Hello! I am your **Intelligent Product Support Assistant**.\n\nI can help you troubleshoot your hardware devices (routers, thermostats, headphones) with **strict version-accurate instructions**, or assist with general orders, returns, and support FAQs.\n\n*Select a device on the left or type your question below!*",
      citations: [],
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [visualInspection, setVisualInspection] = useState("");
  const [isVisionOpen, setIsVisionOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isDocUploadOpen, setIsDocUploadOpen] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchDevices()
      .then((data) => setDevices(data.devices || []))
      .catch((err) => console.error("Could not load devices:", err));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const query = inputPrompt.trim();
    if (!query || loading) return;

    const userMsg = {
      role: "user",
      content: query,
      visualInfo: visualInspection,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    const attachedVisual = visualInspection;
    setVisualInspection("");
    setLoading(true);

    try {
      // Build brief history for assessor context excluding the welcome greeting
      const historyContext = messages
        .filter((m, idx) => idx > 0 && (m.role === "user" || m.role === "bot"))
        .slice(-4)
        .map((m) => ({
          role: m.role === "bot" ? "assistant" : "user",
          content: m.content,
        }));

      const res = await sendChatMessage({
        question: query,
        history: historyContext,
        activeProduct: selectedProduct || null,
        activeVersion: selectedVersion || null,
        visualInfo: attachedVisual,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: res.answer,
          citations: res.citations || [],
          escalated: res.escalated || false,
          interactionId: res.interactionId,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: `⚠️ Error: ${err.message || "Failed to reach backend service."}`,
          escalated: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setSelectedProduct("");
    setSelectedVersion("");
    setVisualInspection("");
    setInputPrompt("");
    setMessages([
      {
        role: "bot",
        content:
          "Starting a fresh new support session.\n\nAll prior conversation context has been reset. How can I assist you today?",
        citations: [],
      },
    ]);
  };

  const handleUploadSuccess = (uploadedInfo) => {
    fetchDevices()
      .then((data) => {
        setDevices(data.devices || []);
        if (uploadedInfo?.productId) {
          setSelectedProduct(uploadedInfo.productId);
          if (uploadedInfo.hardwareVersion) {
            setSelectedVersion(uploadedInfo.hardwareVersion);
          }
          setMessages((prev) => [
            ...prev,
            {
              role: "bot",
              content: `📄 **Manual Uploaded & Active**: Indexed documentation for **${
                uploadedInfo.productName || uploadedInfo.productId
              }** ${
                uploadedInfo.hardwareVersion ? `(${uploadedInfo.hardwareVersion})` : ""
              }.\n\nYou can now ask any troubleshooting, setup, or specification questions directly from this manual!`,
              citations: [],
            },
          ]);
        }
      })
      .catch((err) => console.error("Could not load devices:", err));
  };

  const activeDevice = devices.find((d) => d.id === selectedProduct);
  const activeDisplayName =
    activeDevice?.name ||
    (selectedProduct ? selectedProduct.replace(/-/g, " ").toUpperCase() : "");

  return (
    <div className="app-container">
      <Sidebar
        devices={devices}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        selectedVersion={selectedVersion}
        setSelectedVersion={setSelectedVersion}
        onNewChat={handleNewChat}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenDocUpload={() => setIsDocUploadOpen(true)}
      />

      <main className="chat-main">
        <header className="chat-header">
          <div className="active-context-badge">
            {selectedProduct ? (
              <>
                <FileUp size={15} color="var(--accent-primary)" />
                <span>
                  Active Manual: <strong>{activeDisplayName}</strong>{" "}
                  {selectedVersion ? `(${selectedVersion})` : ""}
                </span>
              </>
            ) : (
              <>
                <Sparkles size={15} color="var(--accent-cyan)" />
                <span>Auto-Detect Product & Knowledge Base</span>
              </>
            )}
          </div>

          <div className="header-actions">
            <button
              className="btn-primary"
              onClick={() => setIsDocUploadOpen(true)}
              style={{ padding: "6px 12px", fontSize: "0.8rem" }}
              title="Upload PDF Manual"
            >
              <FileUp size={15} />
              <span>Upload PDF</span>
            </button>

            <button
              className="btn-icon"
              onClick={() => setIsVisionOpen(true)}
              title="Upload hardware diagnostic photo"
            >
              <Camera size={18} />
            </button>
          </div>
        </header>

        <div className="messages-container">
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}
          {loading && (
            <div className="message-wrapper bot">
              <div className="avatar bot">
                <Loader2 size={18} className="animate-spin" />
              </div>
              <div className="message-bubble" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                Consulting verified hardware manuals and knowledge base...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {visualInspection && (
          <div
            style={{
              padding: "8px 32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(6, 182, 212, 0.08)",
              borderTop: "1px solid rgba(6, 182, 212, 0.2)",
              fontSize: "0.82rem",
              color: "#38bdf8",
            }}
          >
            <span>📸 Visual hardware analysis ready to send with your message</span>
            <button
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              onClick={() => setVisualInspection("")}
            >
              Remove
            </button>
          </div>
        )}

        <div className="chat-input-container">
          <form className="input-box" onSubmit={handleSend}>
            <button
              type="button"
              className="btn-icon"
              style={{ width: "32px", height: "32px" }}
              onClick={() => setIsDocUploadOpen(true)}
              title="Upload and index PDF Manual"
            >
              <FileUp size={16} />
            </button>
            <button
              type="button"
              className="btn-icon"
              style={{ width: "32px", height: "32px" }}
              onClick={() => setIsVisionOpen(true)}
              title="Attach hardware photo"
            >
              <Camera size={16} />
            </button>
            <input
              type="text"
              placeholder={
                selectedProduct
                  ? `Ask a technical question about ${activeDisplayName}...`
                  : "Ask about product troubleshooting, setup, or support..."
              }
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="btn-send"
              disabled={loading || !inputPrompt.trim()}
              title="Send Message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </main>

      <DocumentUploadModal
        isOpen={isDocUploadOpen}
        onClose={() => setIsDocUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        devices={devices}
      />

      <VisionModal
        isOpen={isVisionOpen}
        onClose={() => setIsVisionOpen(false)}
        onAttachInspection={(finding) => setVisualInspection(finding)}
      />

      <StatsModal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />
    </div>
  );
}

export default App;
