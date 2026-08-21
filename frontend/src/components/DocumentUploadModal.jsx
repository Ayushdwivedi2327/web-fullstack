import React, { useState } from "react";
import { X, FileText, Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { uploadDocument } from "../api.js";

export function DocumentUploadModal({ isOpen, onClose, onUploadSuccess, devices = [] }) {
  const [file, setFile] = useState(null);
  const [productName, setProductName] = useState("");
  const [selectedExistingId, setSelectedExistingId] = useState("");
  const [manufacturer, setManufacturer] = useState("General");
  const [hardwareVersion, setHardwareVersion] = useState("V1.0");
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  React.useEffect(() => {
    if (isOpen) {
      setFile(null);
      setProductName("");
      setSelectedExistingId("");
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setSelectedExistingId(""); // Always default to fresh new product container
      const cleanName = selected.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setProductName(cleanName);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Please select a PDF or text manual file.");
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("productId", selectedExistingId || "");
    formData.append("productName", selectedExistingId ? "" : (productName || file.name.replace(/\.[^/.]+$/, "")));
    formData.append("manufacturer", manufacturer);
    formData.append("hardwareVersion", hardwareVersion);

    try {
      const res = await uploadDocument(formData);
      setSuccessMsg(res.message || "Document successfully indexed!");
      if (onUploadSuccess) {
        onUploadSuccess({
          productId: res.productId,
          hardwareVersion: res.hardwareVersion,
          productName: productName || file.name.replace(/\.[^/.]+$/, ""),
          fileName: file.name,
        });
      }
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setFile(null);
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="logo-badge" style={{ width: "32px", height: "32px", background: "linear-gradient(135deg, #f43f5e, #f97316)" }}>
              <FileText size={18} />
            </div>
            <h2 className="modal-title">Upload Hardware Manual / PDF</h2>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Upload official PDF user manuals, installation guides, or specification sheets to index them into the vector database.
          </p>

          <label
            style={{
              border: "2px dashed var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              background: "var(--bg-tertiary)",
            }}
          >
            <input type="file" accept=".pdf,.md,.txt" style={{ display: "none" }} onChange={handleFileChange} />
            <Upload size={28} color="var(--accent-primary)" />
            <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>
              {file ? `Selected: ${file.name}` : "Click to select PDF or Manual"}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Supports PDF, Markdown (.md), Text (.txt)</span>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                Target Product
              </label>
              <select
                className="select-control"
                value={selectedExistingId}
                onChange={(e) => setSelectedExistingId(e.target.value)}
              >
                <option value="">+ Create New Product</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                Hardware Version (e.g. V1, V2)
              </label>
              <input
                type="text"
                className="select-control"
                placeholder="e.g. V1.0 or V2.0"
                value={hardwareVersion}
                onChange={(e) => setHardwareVersion(e.target.value)}
              />
            </div>
          </div>

          {!selectedExistingId && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Product Name
                </label>
                <input
                  type="text"
                  className="select-control"
                  placeholder="e.g. TP-Link Archer AX21"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required={!selectedExistingId}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Manufacturer
                </label>
                <input
                  type="text"
                  className="select-control"
                  placeholder="e.g. TP-Link"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div style={{ color: "var(--accent-rose)", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <AlertCircle size={15} /> {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ color: "var(--accent-emerald)", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle2 size={15} /> {successMsg}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={uploading || !file}
            style={{ justifyContent: "center", marginTop: "6px" }}
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Parsing PDF & Generating Embeddings...</span>
              </>
            ) : (
              <>
                <Upload size={16} />
                <span>Upload & Index Manual</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
