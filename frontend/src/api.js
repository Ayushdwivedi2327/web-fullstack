const API_BASE = "/api";

export async function sendChatMessage({
  question,
  history = [],
  activeProduct = null,
  activeVersion = null,
  visualInfo = "",
}) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      history,
      activeProduct,
      activeVersion,
      visualInfo,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }

  return await res.json();
}

export async function fetchDevices() {
  const res = await fetch(`${API_BASE}/devices`);
  if (!res.ok) throw new Error("Failed to fetch devices");
  return await res.json();
}

export async function submitFeedback({ interactionId, helpful, feedbackText = "" }) {
  const res = await fetch(`${API_BASE}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interactionId, helpful, feedbackText }),
  });
  if (!res.ok) throw new Error("Failed to submit feedback");
  return await res.json();
}

export async function inspectHardwareImage({ imageBase64, mimeType, prompt }) {
  const res = await fetch(`${API_BASE}/vision/inspect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mimeType, prompt }),
  });
  if (!res.ok) throw new Error("Failed to inspect image");
  return await res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return await res.json();
}

export async function uploadDocument(formData) {
  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }
  return await res.json();
}

export async function fetchDocuments() {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) throw new Error("Failed to fetch documents");
  return await res.json();
}
