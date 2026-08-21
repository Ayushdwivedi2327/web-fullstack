import React, { useState } from "react";
import { X, Camera, Upload, Check, AlertCircle, Loader2 } from "lucide-react";
import { inspectHardwareImage } from "../api.js";

export function VisionModal({ isOpen, onClose, onAttachInspection }) {
  const [imagePreview, setImagePreview] = useState(null);
  const [base64Data, setBase64Data] = useState(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [inspecting, setInspecting] = useState(false);
  const [finding, setFinding] = useState("");
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      setImagePreview(result);
      // Strip data url prefix
      const b64 = result.split(",")[1];
      setBase64Data(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleInspect = async () => {
    if (!base64Data) return;
    setInspecting(true);
    setError(null);
    try {
      const res = await inspectHardwareImage({
        imageBase64: base64Data,
        mimeType,
        prompt:
          "Identify the device model, hardware revision (e.g. V1/V2), serial/MAC, and LED indicator lights on this product.",
      });
      setFinding(res.finding);
    } catch (err) {
      setError(err.message || "Failed to inspect image");
    } finally {
      setInspecting(false);
    }
  };

  const handleApply = () => {
    onAttachInspection(finding);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="logo-badge" style={{ width: "32px", height: "32px" }}>
              <Camera size={18} />
            </div>
            <h2 className="modal-title">Hardware Visual Inspector</h2>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Upload a photo of your router back-label, LED status panel, or error screen for AI multimodal hardware identification.
          </p>

          <label
            style={{
              border: "2px dashed var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              background: "var(--bg-tertiary)",
            }}
          >
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Hardware Preview"
                style={{ maxHeight: "180px", maxWidth: "100%", borderRadius: "8px", objectFit: "contain" }}
              />
            ) : (
              <>
                <Upload size={32} color="var(--accent-primary)" />
                <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Click to browse or drop device image</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Supports PNG, JPG, WebP</span>
              </>
            )}
          </label>

          {imagePreview && !finding && (
            <button
              className="btn-primary"
              onClick={handleInspect}
              disabled={inspecting}
              style={{ justifyContent: "center" }}
            >
              {inspecting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Scanning Hardware Image...</span>
                </>
              ) : (
                <>
                  <Camera size={16} />
                  <span>Inspect Hardware Details</span>
                </>
              )}
            </button>
          )}

          {error && (
            <div style={{ color: "var(--accent-rose)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {finding && (
            <div
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "14px",
                fontSize: "0.85rem",
                maxHeight: "150px",
                overflowY: "auto",
              }}
            >
              <div style={{ fontWeight: 600, color: "var(--accent-cyan)", marginBottom: "6px" }}>
                AI Visual Findings:
              </div>
              <div style={{ whiteSpace: "pre-wrap", color: "var(--text-secondary)" }}>{finding}</div>
            </div>
          )}

          {finding && (
            <button className="btn-primary" onClick={handleApply} style={{ justifyContent: "center" }}>
              <Check size={16} />
              <span>Attach Finding to Chat</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
