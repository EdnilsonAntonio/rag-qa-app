import Link from "next/link";

const FEATURES = [
  {
    icon: "◈",
    title: "PDF → vectors in seconds",
    desc: "Upload a document, automatic chunking and embedding into Pinecone — ready to query.",
  },
  {
    icon: "◎",
    title: "History-aware retrieval",
    desc: "Follow-up questions are rephrased so context from earlier turns still matters.",
  },
  {
    icon: "❖",
    title: "Grounded, cited answers",
    desc: "Responses use only retrieved excerpts, with chunk references like [1] and [2].",
  },
  {
    icon: "◇",
    title: "Streaming replies",
    desc: "Answers appear token by token — no staring at a blank screen.",
  },
  {
    icon: "▣",
    title: "One namespace per file",
    desc: "Each PDF lives in its own space. Switch documents without mixing contexts.",
  },
  {
    icon: "◐",
    title: "Built for real stacks",
    desc: "Next.js API routes, LangChain, OpenAI embeddings, GPT-4o — production patterns.",
  },
] as const;

const STEPS = [
  {
    n: "01",
    title: "Ingest",
    desc: "Parse PDF text, split into overlapping chunks, embed with text-embedding-3-small.",
  },
  {
    n: "02",
    title: "Retrieve",
    desc: "Your question (plus chat history) finds the most relevant passages in Pinecone.",
  },
  {
    n: "03",
    title: "Answer",
    desc: "GPT-4o reads those passages only and streams a cited reply back to you.",
  },
] as const;

const STACK = [
  "Next.js",
  "LangChain",
  "OpenAI",
  "Pinecone",
  "pdf-parse",
] as const;

export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0c0c0d;
          --bg2: #141415;
          --bg3: #1c1c1e;
          --border: rgba(255,255,255,0.07);
          --border-hover: rgba(255,255,255,0.14);
          --accent: #e8ff6b;
          --accent-dim: rgba(232,255,107,0.12);
          --accent-glow: rgba(232,255,107,0.22);
          --text: #f0efe8;
          --text-muted: #9a9890;
          --text-dim: #5c5b56;
          --font-mono: 'DM Mono', monospace;
          --font-serif: 'Instrument Serif', serif;
          --font-sans: 'Geist', system-ui, sans-serif;
          --radius: 14px;
          --max: 1120px;
        }

        html { scroll-behavior: smooth; }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: var(--font-sans);
          line-height: 1.5;
          overflow-x: hidden;
        }

        .landing {
          min-height: 100dvh;
          position: relative;
        }

        .landing-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background:
            radial-gradient(ellipse 80% 50% at 50% -20%, var(--accent-glow), transparent 55%),
            radial-gradient(circle at 85% 60%, rgba(120, 140, 255, 0.06), transparent 40%),
            var(--bg);
        }

        .landing-grid {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent);
          opacity: 0.45;
        }

        .landing-inner {
          position: relative;
          z-index: 1;
        }

        /* Nav */
        .nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: var(--max);
          margin: 0 auto;
          padding: 20px 24px;
          padding-top: max(20px, env(safe-area-inset-top));
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: var(--text);
        }

        .nav-mark { color: var(--accent); font-size: 20px; line-height: 1; }

        .nav-logo {
          font-family: var(--font-mono);
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.14em;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-link {
          font-size: 13px;
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.15s;
          display: none;
        }

        .nav-link:hover { color: var(--text); }

        @media (min-width: 640px) {
          .nav-link { display: inline; }
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: var(--font-sans);
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          border-radius: 10px;
          padding: 10px 18px;
          transition: transform 0.15s, filter 0.15s, border-color 0.15s, background 0.15s;
          cursor: pointer;
          border: none;
        }

        .btn:active { transform: scale(0.98); }

        .btn-primary {
          background: var(--accent);
          color: #0c0c0d;
        }

        .btn-primary:hover {
          filter: brightness(1.08);
          box-shadow: 0 0 32px var(--accent-glow);
        }

        .btn-ghost {
          background: transparent;
          color: var(--text-muted);
          border: 1px solid var(--border);
        }

        .btn-ghost:hover {
          border-color: var(--border-hover);
          color: var(--text);
          background: var(--bg2);
        }

        .btn-lg {
          padding: 14px 24px;
          font-size: 15px;
          border-radius: 12px;
        }

        /* Hero */
        .hero {
          max-width: var(--max);
          margin: 0 auto;
          padding: 48px 24px 80px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
          align-items: center;
        }

        @media (min-width: 900px) {
          .hero {
            grid-template-columns: 1fr 1fr;
            padding: 64px 24px 100px;
            gap: 56px;
          }
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--accent);
          background: var(--accent-dim);
          border: 1px solid rgba(232,255,107,0.2);
          padding: 6px 12px;
          border-radius: 999px;
          margin-bottom: 24px;
        }

        .hero-badge-pip {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }

        .hero-title {
          font-family: var(--font-serif);
          font-size: clamp(2.75rem, 8vw, 4.25rem);
          font-weight: 400;
          line-height: 1.05;
          letter-spacing: -0.02em;
          margin-bottom: 20px;
        }

        .hero-title em {
          font-style: italic;
          color: var(--accent);
        }

        .hero-lead {
          font-size: clamp(1rem, 2.5vw, 1.125rem);
          color: var(--text-muted);
          max-width: 32rem;
          line-height: 1.7;
          margin-bottom: 32px;
        }

        .hero-ctas {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        /* Preview card */
        .preview {
          position: relative;
        }

        .preview-glow {
          position: absolute;
          inset: -20%;
          background: radial-gradient(circle, var(--accent-glow), transparent 65%);
          filter: blur(40px);
          opacity: 0.6;
        }

        .preview-card {
          position: relative;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: 0 24px 80px rgba(0,0,0,0.45);
        }

        .preview-chrome {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          background: var(--bg3);
        }

        .preview-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--text-dim);
        }

        .preview-dot:nth-child(1) { background: #ff6b6b; opacity: 0.7; }
        .preview-dot:nth-child(2) { background: #ffd93d; opacity: 0.7; }
        .preview-dot:nth-child(3) { background: #6bcb77; opacity: 0.7; }

        .preview-title {
          margin-left: 8px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--text-dim);
        }

        .preview-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-height: 280px;
        }

        .preview-msg {
          max-width: 88%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.55;
        }

        .preview-msg.user {
          align-self: flex-end;
          background: var(--accent-dim);
          border: 1px solid rgba(232,255,107,0.18);
          border-top-right-radius: 4px;
        }

        .preview-msg.bot {
          align-self: flex-start;
          background: var(--bg3);
          border: 1px solid var(--border);
          border-top-left-radius: 4px;
          color: var(--text-muted);
        }

        .preview-msg.bot strong { color: var(--text); font-weight: 500; }

        .preview-cite {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--accent);
          background: var(--accent-dim);
          padding: 1px 5px;
          border-radius: 4px;
          border: 1px solid rgba(232,255,107,0.2);
        }

        .preview-input {
          margin: 0 16px 16px;
          display: flex;
          gap: 8px;
          padding: 10px 12px;
          background: var(--bg3);
          border: 1px solid var(--border);
          border-radius: 12px;
        }

        .preview-input span {
          flex: 1;
          font-size: 12px;
          color: var(--text-dim);
        }

        .preview-send {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: var(--accent);
          color: #0c0c0d;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
        }

        /* Sections */
        .section {
          max-width: var(--max);
          margin: 0 auto;
          padding: 0 24px 88px;
        }

        .section-label {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 12px;
        }

        .section-title {
          font-family: var(--font-serif);
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 400;
          margin-bottom: 40px;
          max-width: 20ch;
        }

        .steps {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        @media (min-width: 768px) {
          .steps { grid-template-columns: repeat(3, 1fr); }
        }

        .step-card {
          padding: 24px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          transition: border-color 0.2s;
        }

        .step-card:hover { border-color: var(--border-hover); }

        .step-n {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--accent);
          margin-bottom: 16px;
        }

        .step-card h3 {
          font-size: 17px;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .step-card p {
          font-size: 14px;
          color: var(--text-muted);
          line-height: 1.65;
        }

        .features {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        @media (min-width: 640px) {
          .features { grid-template-columns: repeat(2, 1fr); }
        }

        @media (min-width: 900px) {
          .features { grid-template-columns: repeat(3, 1fr); }
        }

        .feature-card {
          padding: 22px;
          background: linear-gradient(145deg, var(--bg2), transparent);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          transition: border-color 0.2s, transform 0.2s;
        }

        .feature-card:hover {
          border-color: rgba(232,255,107,0.25);
          transform: translateY(-2px);
        }

        .feature-icon {
          font-size: 18px;
          color: var(--accent);
          margin-bottom: 14px;
        }

        .feature-card h3 {
          font-size: 15px;
          font-weight: 500;
          margin-bottom: 6px;
        }

        .feature-card p {
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.6;
        }

        .stack-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .stack-pill {
          font-family: var(--font-mono);
          font-size: 12px;
          padding: 8px 14px;
          border-radius: 999px;
          background: var(--bg2);
          border: 1px solid var(--border);
          color: var(--text-muted);
        }

        /* CTA band */
        .cta-band {
          max-width: var(--max);
          margin: 0 auto 88px;
          padding: 0 24px;
        }

        .cta-inner {
          text-align: center;
          padding: 48px 28px;
          border-radius: calc(var(--radius) + 4px);
          background:
            linear-gradient(135deg, var(--accent-dim), transparent 50%),
            var(--bg2);
          border: 1px solid rgba(232,255,107,0.2);
        }

        .cta-inner h2 {
          font-family: var(--font-serif);
          font-size: clamp(1.5rem, 4vw, 2.25rem);
          font-weight: 400;
          margin-bottom: 12px;
        }

        .cta-inner p {
          color: var(--text-muted);
          font-size: 15px;
          margin-bottom: 28px;
          max-width: 36ch;
          margin-left: auto;
          margin-right: auto;
        }

        /* Footer */
        .footer {
          max-width: var(--max);
          margin: 0 auto;
          padding: 28px 24px max(28px, env(safe-area-inset-bottom));
          border-top: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
          text-align: center;
        }

        @media (min-width: 640px) {
          .footer {
            flex-direction: row;
            justify-content: space-between;
            text-align: left;
          }
        }

        .footer-tech {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--text-dim);
        }

        .footer-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 6px 14px;
          font-size: 13px;
        }

        .footer-links a {
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.15s;
        }

        .footer-links a:hover { color: var(--accent); }

        .footer-sep { color: var(--text-dim); }
      `}</style>

      <div className="landing">
        <div className="landing-bg" aria-hidden="true" />
        <div className="landing-grid" aria-hidden="true" />

        <div className="landing-inner">
          <header className="nav">
            <Link href="/" className="nav-brand">
              <span className="nav-mark">▲</span>
              <span className="nav-logo">RAG·QA</span>
            </Link>
            <div className="nav-actions">
              <a
                href="https://github.com/EdnilsonAntonio/rag-qa-app"
                className="nav-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                Github
              </a>
              <Link href="/app" className="btn btn-primary">
                Launch app →
              </Link>
            </div>
          </header>

          <section className="hero">
            <div className="hero-copy">
              <div className="hero-badge">
                <span className="hero-badge-pip" />
                Retrieval-Augmented Generation
              </div>
              <h1 className="hero-title">
                Chat with your <em>PDFs</em>, not your memory.
              </h1>
              <p className="hero-lead">
                Upload a document, ask questions in plain language, and get
                answers grounded in your file — with citations back to the source
                chunks.
              </p>
              <div className="hero-ctas">
                <Link href="/app" className="btn btn-primary btn-lg">
                  Start chatting
                </Link>
                <a
                  href="https://github.com/EdnilsonAntonio/rag-qa-app"
                  className="btn btn-ghost btn-lg"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View source
                </a>
              </div>
            </div>

            <div className="preview" aria-hidden="true">
              <div className="preview-glow" />
              <div className="preview-card">
                <div className="preview-chrome">
                  <span className="preview-dot" />
                  <span className="preview-dot" />
                  <span className="preview-dot" />
                  <span className="preview-title">EqDif.pdf · 68 chunks</span>
                </div>
                <div className="preview-body">
                  <div className="preview-msg user">
                    O que é uma equação diferencial?
                  </div>
                  <div className="preview-msg bot">
                    Uma equação diferencial relaciona uma função às suas
                    derivadas <span className="preview-cite">[1]</span>
                    <span className="preview-cite">[2]</span>. O documento
                    apresenta exemplos de 1ª e 2ª ordem…
                  </div>
                </div>
                <div className="preview-input">
                  <span>Pergunte sobre o documento…</span>
                  <div className="preview-send">↑</div>
                </div>
              </div>
            </div>
          </section>

          <section className="section" id="how-it-works">
            <p className="section-label">Pipeline</p>
            <h2 className="section-title">How RAG·QA works under the hood</h2>
            <div className="steps">
              {STEPS.map((s) => (
                <article key={s.n} className="step-card">
                  <p className="step-n">{s.n}</p>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="section">
            <p className="section-label">Features</p>
            <h2 className="section-title">Everything you need to learn and ship RAG</h2>
            <div className="features">
              {FEATURES.map((f) => (
                <article key={f.title} className="feature-card">
                  <div className="feature-icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="section">
            <p className="section-label">Stack</p>
            <h2 className="section-title">Built with tools you&apos;ll see in production</h2>
            <div className="stack-row">
              {STACK.map((t) => (
                <span key={t} className="stack-pill">
                  {t}
                </span>
              ))}
            </div>
          </section>

          <section className="cta-band">
            <div className="cta-inner">
              <h2>Ready to talk to your documents?</h2>
              <p>
                No sign-up in the demo — just add your API keys locally and
                upload a PDF.
              </p>
              <Link href="/app" className="btn btn-primary btn-lg">
                Open the app
              </Link>
            </div>
          </section>

          <footer className="footer">
            <p className="footer-tech">Next.js · LangChain · Pinecone · OpenAI</p>
            <p className="footer-links">
              <a
                href="https://ednilsonantonio.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ednilson António
              </a>
              <span className="footer-sep">·</span>
              <a
                href="https://github.com/EdnilsonAntonio/rag-qa-app"
                target="_blank"
                rel="noopener noreferrer"
              >
                Github repository
              </a>
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
