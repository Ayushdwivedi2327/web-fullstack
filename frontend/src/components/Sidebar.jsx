import React from "react";
import { Cpu, Database, Layers, Plus } from "lucide-react";

export function Sidebar({
  devices = [],
  selectedProduct,
  setSelectedProduct,
  selectedVersion,
  setSelectedVersion,
  onNewChat,
  onOpenStats,
  onOpenDocUpload,
}) {
  const currentDevice = devices.find((d) => d.id === selectedProduct);
  const versions = currentDevice?.hardwareVersions || [];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-badge">
          <Cpu size={22} />
        </div>
        <div>
          <h1 className="sidebar-title">Support Assistant</h1>
          <p className="sidebar-subtitle">Hardware Grounded AI</p>
        </div>
      </div>

      <div className="sidebar-content">
        <button className="btn-primary" onClick={onNewChat} style={{ width: "100%", justifyContent: "center" }}>
          <Plus size={18} />
          <span>New Support Session</span>
        </button>

        <button
          className="btn-feedback"
          onClick={onOpenDocUpload}
          style={{ width: "100%", justifyContent: "center", padding: "9px", background: "rgba(244, 63, 94, 0.1)", borderColor: "rgba(244, 63, 94, 0.3)", color: "#fda4af" }}
        >
          <Layers size={15} />
          <span>+ Upload PDF / Manual</span>
        </button>

        <div>
          <div className="sidebar-section-label">Active Hardware Model</div>
          <div className="device-picker">
            <select
              className="select-control"
              value={selectedProduct || ""}
              onChange={(e) => {
                setSelectedProduct(e.target.value || null);
                setSelectedVersion("");
              }}
            >
              <option value="">Auto-Detect / General Support</option>
              {devices.map((dev) => (
                <option key={dev.id} value={dev.id}>
                  {dev.name}
                </option>
              ))}
            </select>

            {selectedProduct && versions.length > 0 && (
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                  Hardware Revision:
                </div>
                <div className="version-pills">
                  <button
                    className={`version-pill ${!selectedVersion ? "active" : ""}`}
                    onClick={() => setSelectedVersion("")}
                  >
                    All Revisions
                  </button>
                  {versions.map((ver) => (
                    <button
                      key={ver}
                      className={`version-pill ${selectedVersion === ver ? "active" : ""}`}
                      onClick={() => setSelectedVersion(ver)}
                    >
                      {ver}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="sidebar-footer">
        <button
          className="btn-feedback"
          onClick={onOpenStats}
          style={{ width: "100%", justifyContent: "center", padding: "8px" }}
        >
          <Database size={15} />
          <span>System & Vector Metrics</span>
        </button>
      </div>
    </aside>
  );
}
