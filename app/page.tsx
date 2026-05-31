"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UploadedDoc {
  fileName: string;
  namespace: string;
  chunkCount: number;
  uploadedAt: Date;
}

// ── Markdown renderer (no external deps) ────────────────────────────────────
function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[(\d+)\]/g, '<span class="citation">[$1]</span>')
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
}

// ── Upload Panel ─────────────────────────────────────────────────────────────
function UploadPanel({
  docs,
  activeNamespace,
  onDocSelect,
  onUpload,
}: {
  docs: UploadedDoc[];
  activeNamespace: string | null;
  onDocSelect: (ns: string) => void;
  onUpload: (doc: UploadedDoc) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        setUploadError("Only PDF files are supported.");
        return;
      }
      setUploadError(null);
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/ingest", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Upload failed.");

        onUpload({
          fileName: data.fileName,
          namespace: data.namespace,
          chunkCount: data.chunkCount,
          uploadedAt: new Date(),
        });
      } catch (err: unknown) {
        setUploadError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="logo-mark">▲</span>
        <span className="logo-text">RAG·QA</span>
      </div>

      {/* Drop zone */}
      <div
        className={`drop-zone ${isDragging ? "dragging" : ""} ${isUploading ? "uploading" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        {isUploading ? (
          <>
            <div className="spinner" />
            <p className="drop-label">Indexing chunks…</p>
          </>
        ) : (
          <>
            <div className="drop-icon">⊕</div>
            <p className="drop-label">Drop PDF here</p>
            <p className="drop-sub">or click to browse</p>
          </>
        )}
      </div>

      {uploadError && <p className="upload-error">{uploadError}</p>}

      {/* Document list */}
      {docs.length > 0 && (
        <div className="doc-list">
          <p className="doc-list-label">Documents</p>
          {docs.map((doc) => (
            <button
              key={doc.namespace}
              className={`doc-item ${activeNamespace === doc.namespace ? "active" : ""}`}
              onClick={() => onDocSelect(doc.namespace)}
            >
              <span className="doc-icon">◈</span>
              <span className="doc-info">
                <span className="doc-name">{doc.fileName}</span>
                <span className="doc-meta">{doc.chunkCount} chunks</span>
              </span>
              {activeNamespace === doc.namespace && (
                <span className="doc-active-pip" />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="sidebar-footer">
        <p>Built with Next.js · LangChain · Pinecone</p>
        <p>
          <a
            href="https://ednilsonantonio.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ednilson António
          </a>
        </p>
      </div>
    </aside>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({
  message,
  isStreaming,
}: {
  message: Message;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";
  return (
    <div className={`message-row ${isUser ? "user" : "assistant"}`}>
      {!isUser && <span className="avatar">✦</span>}
      <div
        className={`bubble ${isUser ? "bubble-user" : "bubble-assistant"}`}
      >
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <span
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
          />
        )}
        {isStreaming && <span className="cursor-blink" />}
      </div>
      {isUser && <span className="avatar avatar-user">you</span>}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ hasDoc }: { hasDoc: boolean }) {
  return (
    <div className="empty-state">
      <div className="empty-glyph">◈</div>
      {hasDoc ? (
        <>
          <p className="empty-title">Ready to answer</p>
          <p className="empty-sub">Ask anything about your document.</p>
        </>
      ) : (
        <>
          <p className="empty-title">No document selected</p>
          <p className="empty-sub">Upload a PDF on the left to get started.</p>
        </>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [activeNamespace, setActiveNamespace] = useState<string | null>(null);
  const [messagesByNs, setMessagesByNs] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messages: Message[] = activeNamespace
    ? (messagesByNs[activeNamespace] ?? [])
    : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  const handleUpload = (doc: UploadedDoc) => {
    setDocs((prev) => {
      const exists = prev.find((d) => d.namespace === doc.namespace);
      return exists ? prev : [doc, ...prev];
    });
    setActiveNamespace(doc.namespace);
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !activeNamespace || isStreaming) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const currentMessages = messagesByNs[activeNamespace] ?? [];
    const nextMessages = [...currentMessages, userMessage];

    setMessagesByNs((prev) => ({ ...prev, [activeNamespace]: nextMessages }));
    setInput("");
    setIsStreaming(true);

    // Placeholder for streaming assistant reply
    const assistantPlaceholder: Message = { role: "assistant", content: "" };
    setMessagesByNs((prev) => ({
      ...prev,
      [activeNamespace]: [...nextMessages, assistantPlaceholder],
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          namespace: activeNamespace,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Request failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const snapshot = accumulated;
        setMessagesByNs((prev) => {
          const msgs = [...(prev[activeNamespace] ?? [])];
          msgs[msgs.length - 1] = { role: "assistant", content: snapshot };
          return { ...prev, [activeNamespace]: msgs };
        });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Something went wrong.";
      setMessagesByNs((prev) => {
        const msgs = [...(prev[activeNamespace] ?? [])];
        msgs[msgs.length - 1] = {
          role: "assistant",
          content: `⚠ ${errMsg}`,
        };
        return { ...prev, [activeNamespace]: msgs };
      });
    } finally {
      setIsStreaming(false);
    }
  }, [input, activeNamespace, isStreaming, messagesByNs]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const activeDoc = docs.find((d) => d.namespace === activeNamespace);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0c0c0d;
          --bg2: #141415;
          --bg3: #1c1c1e;
          --border: rgba(255,255,255,0.07);
          --border-hover: rgba(255,255,255,0.13);
          --accent: #e8ff6b;
          --accent-dim: rgba(232,255,107,0.12);
          --accent-glow: rgba(232,255,107,0.25);
          --text: #f0efe8;
          --text-muted: #7a7975;
          --text-dim: #4a4945;
          --font-mono: 'DM Mono', monospace;
          --font-serif: 'Instrument Serif', serif;
          --font-sans: 'Geist', sans-serif;
          --radius: 12px;
          --sidebar-w: 260px;
        }

        html, body { height: 100%; background: var(--bg); color: var(--text); font-family: var(--font-sans); }

        .layout {
          display: grid;
          grid-template-columns: var(--sidebar-w) 1fr;
          height: 100vh;
          overflow: hidden;
        }

        /* ── Sidebar ── */
        .sidebar {
          background: var(--bg2);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 20px 16px;
          gap: 16px;
          overflow-y: auto;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 4px;
          margin-bottom: 4px;
        }

        .logo-mark {
          color: var(--accent);
          font-size: 18px;
          line-height: 1;
        }

        .logo-text {
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.15em;
          color: var(--text);
        }

        /* Drop zone */
        .drop-zone {
          border: 1.5px dashed var(--border-hover);
          border-radius: var(--radius);
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
          min-height: 110px;
          justify-content: center;
        }

        .drop-zone:hover, .drop-zone.dragging {
          border-color: var(--accent);
          background: var(--accent-dim);
        }

        .drop-zone.uploading {
          cursor: default;
          border-color: var(--border-hover);
          background: transparent;
        }

        .drop-icon {
          font-size: 24px;
          color: var(--text-muted);
          line-height: 1;
          transition: color 0.2s;
        }

        .drop-zone:hover .drop-icon, .drop-zone.dragging .drop-icon {
          color: var(--accent);
        }

        .drop-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
        }

        .drop-sub {
          font-size: 11px;
          color: var(--text-muted);
        }

        /* Spinner */
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid var(--border-hover);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .upload-error {
          font-size: 12px;
          color: #ff6b6b;
          padding: 0 4px;
        }

        /* Doc list */
        .doc-list { display: flex; flex-direction: column; gap: 4px; }

        .doc-list-label {
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-dim);
          padding: 0 6px;
          margin-bottom: 4px;
          font-family: var(--font-mono);
        }

        .doc-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
          width: 100%;
          color: var(--text-muted);
        }

        .doc-item:hover {
          background: var(--bg3);
          border-color: var(--border);
          color: var(--text);
        }

        .doc-item.active {
          background: var(--accent-dim);
          border-color: rgba(232,255,107,0.2);
          color: var(--text);
        }

        .doc-icon {
          font-size: 14px;
          color: var(--text-dim);
          flex-shrink: 0;
        }

        .doc-item.active .doc-icon { color: var(--accent); }

        .doc-info {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
          flex: 1;
        }

        .doc-name {
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 150px;
        }

        .doc-meta {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--text-dim);
        }

        .doc-active-pip {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent);
          flex-shrink: 0;
        }

        .sidebar-footer {
          margin-top: auto;
          font-size: 10px;
          color: var(--text-dim);
          font-family: var(--font-mono);
          padding: 0 4px;
          line-height: 1.6;
        }

        .sidebar-footer a {
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.15s;
        }

        .sidebar-footer a:hover {
          color: var(--accent);
        }

        /* ── Main ── */
        .main {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
          background: var(--bg);
        }

        /* Top bar */
        .topbar {
          display: flex;
          align-items: center;
          padding: 14px 28px;
          border-bottom: 1px solid var(--border);
          gap: 12px;
          flex-shrink: 0;
          min-height: 56px;
        }

        .topbar-doc {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
          font-family: var(--font-mono);
        }

        .topbar-chunks {
          font-size: 11px;
          color: var(--text-dim);
          font-family: var(--font-mono);
          background: var(--bg3);
          padding: 2px 8px;
          border-radius: 20px;
          border: 1px solid var(--border);
        }

        .topbar-placeholder {
          font-size: 13px;
          color: var(--text-dim);
          font-family: var(--font-mono);
        }

        /* Messages */
        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          scrollbar-width: thin;
          scrollbar-color: var(--border) transparent;
        }

        /* Empty state */
        .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          height: 100%;
          padding-bottom: 80px;
        }

        .empty-glyph {
          font-size: 36px;
          color: var(--text-dim);
          margin-bottom: 4px;
        }

        .empty-title {
          font-family: var(--font-serif);
          font-size: 20px;
          color: var(--text-muted);
          font-style: italic;
        }

        .empty-sub {
          font-size: 13px;
          color: var(--text-dim);
        }

        /* Message rows */
        .message-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          animation: fadeUp 0.2s ease;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .message-row.user { flex-direction: row-reverse; }

        .avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
          background: var(--accent-dim);
          border: 1px solid rgba(232,255,107,0.2);
          color: var(--accent);
          margin-top: 2px;
        }

        .avatar-user {
          font-size: 9px;
          font-family: var(--font-mono);
          font-weight: 500;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          background: var(--bg3);
          border-color: var(--border);
        }

        .bubble {
          max-width: min(560px, 75%);
          padding: 12px 16px;
          border-radius: 14px;
          font-size: 14px;
          line-height: 1.65;
          position: relative;
        }

        .bubble-assistant {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-top-left-radius: 4px;
          color: var(--text);
        }

        .bubble-user {
          background: var(--accent-dim);
          border: 1px solid rgba(232,255,107,0.18);
          border-top-right-radius: 4px;
          color: var(--text);
        }

        .bubble p { margin: 0; }
        .bubble p + p { margin-top: 8px; }
        .bubble strong { font-weight: 500; color: var(--text); }
        .bubble code {
          font-family: var(--font-mono);
          font-size: 12px;
          background: var(--bg3);
          padding: 1px 5px;
          border-radius: 4px;
          color: var(--accent);
        }

        .citation {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--accent);
          background: var(--accent-dim);
          padding: 0 4px;
          border-radius: 4px;
          border: 1px solid rgba(232,255,107,0.2);
          cursor: pointer;
        }

        /* Blinking cursor during streaming */
        .cursor-blink {
          display: inline-block;
          width: 2px;
          height: 14px;
          background: var(--accent);
          border-radius: 1px;
          margin-left: 2px;
          vertical-align: text-bottom;
          animation: blink 0.8s step-end infinite;
        }

        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        /* Input bar */
        .input-bar {
          padding: 16px 28px 20px;
          border-top: 1px solid var(--border);
          flex-shrink: 0;
          background: var(--bg);
        }

        .input-wrap {
          display: flex;
          gap: 10px;
          align-items: flex-end;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 10px 10px 10px 16px;
          transition: border-color 0.2s;
        }

        .input-wrap:focus-within {
          border-color: rgba(232,255,107,0.35);
        }

        .input-textarea {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text);
          font-family: var(--font-sans);
          font-size: 14px;
          line-height: 1.5;
          resize: none;
          min-height: 24px;
          max-height: 160px;
          overflow-y: auto;
          scrollbar-width: none;
        }

        .input-textarea::placeholder { color: var(--text-dim); }

        .send-btn {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          border: none;
          background: var(--accent);
          color: #0c0c0d;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s;
          font-weight: 700;
          line-height: 1;
        }

        .send-btn:hover:not(:disabled) { filter: brightness(1.1); transform: scale(1.04); }
        .send-btn:disabled { opacity: 0.35; cursor: default; transform: none; }

        .input-hint {
          font-size: 11px;
          color: var(--text-dim);
          margin-top: 8px;
          padding: 0 4px;
          font-family: var(--font-mono);
        }
      `}</style>

      <div className="layout">
        {/* Left: sidebar */}
        <UploadPanel
          docs={docs}
          activeNamespace={activeNamespace}
          onDocSelect={setActiveNamespace}
          onUpload={handleUpload}
        />

        {/* Right: chat */}
        <div className="main">
          {/* Top bar */}
          <div className="topbar">
            {activeDoc ? (
              <>
                <span className="topbar-doc">◈ {activeDoc.fileName}</span>
                <span className="topbar-chunks">{activeDoc.chunkCount} chunks indexed</span>
              </>
            ) : (
              <span className="topbar-placeholder">No document selected</span>
            )}
          </div>

          {/* Messages or empty state */}
          {messages.length === 0 ? (
            <div className="messages" style={{ justifyContent: "center" }}>
              <EmptyState hasDoc={!!activeNamespace} />
            </div>
          ) : (
            <div className="messages">
              {messages.map((m, i) => (
                <MessageBubble
                  key={i}
                  message={m}
                  isStreaming={
                    isStreaming && i === messages.length - 1 && m.role === "assistant"
                  }
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input */}
          <div className="input-bar">
            <div className="input-wrap">
              <textarea
                ref={textareaRef}
                className="input-textarea"
                placeholder={
                  activeNamespace
                    ? "Ask a question about the document…"
                    : "Upload a PDF to start asking questions…"
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={!activeNamespace || isStreaming}
                rows={1}
              />
              <button
                className="send-btn"
                onClick={sendMessage}
                disabled={!activeNamespace || !input.trim() || isStreaming}
                aria-label="Send"
              >
                ↑
              </button>
            </div>
            <p className="input-hint">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      </div>
    </>
  );
}