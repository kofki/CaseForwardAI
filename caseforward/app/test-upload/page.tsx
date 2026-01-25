"use client";

import { useState } from "react";

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");

  async function upload() {
    if (!file) {
      setStatus("No file selected");
      return;
    }

    setStatus("Uploading...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("caseId", "test-case-123");

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(`Error: ${data.message}`);
        return;
      }

      setStatus(`Success! Document ID: ${data.documentId}`);
    } catch (err) {
      console.error(err);
      setStatus("Upload failed");
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDF Upload Test</h1>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <br /><br />

      <button onClick={upload}>Upload PDF</button>

      <p>{status}</p>
    </div>
  );
}
