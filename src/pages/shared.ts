export const SHARED_CSS = `
:root {
  --accent: #FF3B00;
  --accent-soft: rgba(255, 59, 0, 0.12);
  --font-family-body: system-ui, -apple-system, "Segoe UI", "Helvetica Neue",
    "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif;
  --font-family-display: "Space Grotesk", system-ui, -apple-system, sans-serif;
  --font-family-mono: "JetBrains Mono", "SF Mono", "Menlo", Consolas,
    "Liberation Mono", monospace;
  --content-width: min(720px, 88vw);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-power: cubic-bezier(0.65, 0, 0.35, 1);
}

html[data-theme="light"] {
  --bg: #fff;
  --bg-soft: #f5f5f5;
  --text: #000;
  --text-secondary: #666;
  --text-tertiary: #999;
  --border: #ddd;
  --code-bg: #f0f0f0;
}

html[data-theme="dark"] {
  --bg: #111;
  --bg-soft: #1a1a1a;
  --text: #eee;
  --text-secondary: #999;
  --text-tertiary: #666;
  --border: #333;
  --code-bg: #222;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html {
  font-family: var(--font-family-body);
  background: var(--bg);
  color: var(--text);
  line-height: 1.7;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition: background 0.25s var(--ease-out-expo), color 0.25s var(--ease-out-expo);
}

body { min-height: 100vh; display: flex; flex-direction: column; }

a { color: inherit; text-decoration: none; }
button { font-family: inherit; }

code, pre { font-family: var(--font-family-mono); }

code {
  background: var(--code-bg);
  padding: 0.1em 0.4em;
  border-radius: 3px;
  font-size: 0.88em;
}

pre {
  background: var(--code-bg);
  padding: 1rem 1.1rem;
  border-radius: 6px;
  overflow-x: auto;
  margin: 1em 0;
  border: 1px solid var(--border);
  line-height: 1.6;
}

pre code { background: transparent; padding: 0; border-radius: 0; font-size: 0.85rem; }

::selection { background: var(--accent); color: #fff; }

.container {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: 0 1.5rem;
  width: 100%;
}

/* ====== Site Header ====== */
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 56px;
  background: color-mix(in srgb, var(--bg) 92%, transparent);
  backdrop-filter: saturate(180%) blur(8px);
  -webkit-backdrop-filter: saturate(180%) blur(8px);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
}
.site-header .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.site-logo {
  font-family: var(--font-family-display);
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: -0.02em;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.site-logo::before {
  content: "";
  width: 8px;
  height: 8px;
  background: var(--accent);
  border-radius: 1px;
  display: inline-block;
}
.site-nav { display: flex; gap: 1.5rem; align-items: center; }
.nav-link {
  position: relative;
  font-size: 0.9rem;
  color: var(--text-secondary);
  transition: color 0.25s var(--ease-out-expo);
  padding: 0.4em 0;
}
.nav-link:hover { color: var(--accent); }
.nav-link.active { color: var(--text); font-weight: 500; }
.nav-link.active::after {
  content: "";
  position: absolute;
  left: 0; right: 0; bottom: -19px;
  height: 1px;
  background: var(--accent);
}

.theme-toggle {
  width: 32px;
  height: 32px;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: 50%;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: all 0.25s var(--ease-out-expo);
}
.theme-toggle:hover { color: var(--accent); border-color: var(--accent); }
.theme-toggle .sun { display: none; }
.theme-toggle .moon { display: inline; }
html[data-theme="dark"] .theme-toggle .sun { display: inline; }
html[data-theme="dark"] .theme-toggle .moon { display: none; }

/* ====== Buttons ====== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4em;
  padding: 0.6em 1.2em;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  background: transparent;
  color: var(--text);
  border: 1px solid var(--text);
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.3s var(--ease-out-expo),
    color 0.3s var(--ease-out-expo),
    border-color 0.3s var(--ease-out-expo),
    transform 0.35s var(--ease-spring),
    box-shadow 0.35s var(--ease-out-expo);
  user-select: none;
}
.btn:hover:not(:disabled) {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px var(--accent-soft);
}
.btn:active:not(:disabled) { transform: translateY(0); }
.btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-ghost { border-color: var(--border); }
.btn-ghost:hover:not(:disabled) { border-color: var(--accent); }
.btn-sm { padding: 0.4em 0.8em; font-size: 0.82rem; }
.btn-danger { border-color: var(--accent); color: var(--accent); }
.btn-danger:hover:not(:disabled) { background: var(--accent); color: #fff; }

/* ====== Hero ====== */
.hero { padding: 4rem 0 3rem; }
.hero h1 {
  font-family: var(--font-family-display);
  font-size: 2.4rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin-bottom: 1rem;
}
.hero .lede {
  color: var(--text-secondary);
  font-size: 1.05rem;
  max-width: 560px;
  margin-bottom: 2rem;
}
.cta-row { display: flex; gap: 0.8rem; flex-wrap: wrap; }

/* ====== Sections ====== */
.block {
  padding: 2.5rem 0;
  border-top: 1px solid var(--border);
}
.block h2 {
  font-family: var(--font-family-display);
  font-size: 1.6rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.block h2::before {
  content: "";
  width: 40px;
  height: 2px;
  background: var(--accent);
  flex-shrink: 0;
}
.block h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0.4rem 0;
}
.block p { color: var(--text-secondary); margin-bottom: 0.8rem; }

/* ====== Feature Grid ====== */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}
.feature-card {
  padding: 1.1rem 1.25rem 1.25rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  transition: border-color 0.35s var(--ease-out-expo),
    transform 0.35s var(--ease-spring);
}
.feature-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}
.feature-card p {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* ====== Tags ====== */
.tag {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.2em 0.5em;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  border-radius: 3px;
  transition: all 0.25s var(--ease-out-expo);
}
.feature-card .tag { margin-bottom: 0.3rem; }
.feature-card:hover .tag {
  border-color: var(--accent);
  color: var(--accent);
}

/* ====== Tables ====== */
.route-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 0.88rem;
}
.route-table th, .route-table td {
  text-align: left;
  padding: 0.55em 0.7em;
  border-bottom: 1px solid var(--border);
}
.route-table th {
  font-weight: 600;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--text);
}
.route-table tbody tr {
  transition: background 0.2s var(--ease-out-expo);
}
.route-table tbody tr:hover { background: var(--bg-soft); }
.route-table td.auth-yes { color: var(--accent); font-weight: 500; }
.route-table td.auth-no { color: var(--text-tertiary); }

/* ====== Models list ====== */
.models-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.8rem;
}
.model-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  padding: 0.3em 0.7em;
  font-family: var(--font-family-mono);
  font-size: 0.78rem;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 3px;
  color: var(--text);
  transition: all 0.25s var(--ease-out-expo);
  cursor: default;
}
.model-chip:hover { border-color: var(--accent); color: var(--accent); }
.models-status { color: var(--text-tertiary); font-size: 0.85rem; }

/* ====== Footer ====== */
.site-footer {
  margin-top: 4rem;
  padding: 2rem 0;
  border-top: 1px solid var(--border);
  color: var(--text-tertiary);
  font-size: 0.82rem;
  text-align: center;
}

/* ====== Auth page ====== */
.auth-page {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
}
.auth-card {
  width: 100%;
  max-width: 380px;
  padding: 2rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  animation: fade-up 0.5s var(--ease-out-expo);
}
@keyframes fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.auth-card h1 {
  font-family: var(--font-family-display);
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin-bottom: 0.4rem;
}
.auth-card .auth-sub {
  color: var(--text-secondary);
  font-size: 0.88rem;
  margin-bottom: 1.5rem;
}
.input {
  width: 100%;
  padding: 0.7em 0.9em;
  font: inherit;
  font-size: 0.95rem;
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 4px;
  outline: none;
  transition: border-color 0.25s var(--ease-out-expo);
  font-family: var(--font-family-mono);
}
.input:focus { border-color: var(--text); }
.input:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.auth-card .btn { width: 100%; margin-top: 1rem; }
.auth-error {
  color: var(--accent);
  font-size: 0.82rem;
  margin-top: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.4em;
  animation: shake 0.4s var(--ease-power);
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
.auth-hint {
  margin-top: 1.2rem;
  font-size: 0.78rem;
  color: var(--text-tertiary);
  line-height: 1.5;
}

/* ====== Chat page ====== */
.chat-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  padding: 0 1.5rem;
  min-height: 0;
}
.chat-toolbar {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 0;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 56px;
  background: var(--bg);
  z-index: 50;
  flex-wrap: wrap;
}
.chat-toolbar select {
  flex: 1;
  min-width: 180px;
  max-width: 360px;
  padding: 0.5em 0.8em;
  font: inherit;
  font-size: 0.88rem;
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  font-family: var(--font-family-mono);
  outline: none;
  transition: border-color 0.25s var(--ease-out-expo);
}
.chat-toolbar select:focus { border-color: var(--text); }
.chat-toolbar .toolbar-field {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  font-size: 0.82rem;
  color: var(--text-secondary);
}
.chat-toolbar input[type="number"],
.chat-toolbar input[type="text"] {
  width: 70px;
  padding: 0.35em 0.5em;
  font: inherit;
  font-size: 0.82rem;
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 3px;
  outline: none;
  text-align: center;
  font-family: var(--font-family-mono);
}
.chat-toolbar input[type="text"] {
  width: 140px;
  text-align: left;
}
.chat-toolbar input:focus { border-color: var(--text); }
.chat-toolbar .spacer { flex: 1; }

.messages {
  flex: 1;
  padding: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
  min-height: 0;
}
.msg {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  animation: msg-in 0.4s var(--ease-out-expo);
}
@keyframes msg-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.msg-head {
  display: flex;
  align-items: center;
  gap: 0.6em;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
}
.msg-head .role { font-weight: 600; color: var(--text-secondary); }
.msg-meta {
  margin-left: auto;
  font-size: 0.7rem;
  color: var(--text-tertiary);
  letter-spacing: 0;
  text-transform: none;
}
.msg-body {
  font-size: 0.95rem;
  line-height: 1.7;
  white-space: pre-wrap;
  word-wrap: break-word;
}
.msg-body code {
  background: var(--code-bg);
  padding: 0.1em 0.4em;
  border-radius: 3px;
  font-size: 0.88em;
}
.msg-body pre {
  background: var(--code-bg);
  padding: 0.8rem 1rem;
  border-radius: 5px;
  overflow-x: auto;
  margin: 0.6em 0;
  font-size: 0.85rem;
  border: 1px solid var(--border);
}
.msg-body pre code { background: transparent; padding: 0; font-size: inherit; }
.msg-user { border-left: 2px solid var(--accent); padding-left: 1rem; }
.msg-system .msg-head .role { color: var(--text-tertiary); }
.msg-error .msg-body { color: var(--accent); }

.streaming-cursor {
  display: inline-block;
  width: 7px;
  height: 1em;
  background: var(--accent);
  vertical-align: -2px;
  margin-left: 2px;
  animation: blink 0.9s steps(1) infinite;
}
@keyframes blink { 50% { opacity: 0; } }

.composer {
  border-top: 1px solid var(--border);
  padding: 0.9rem 0 1.4rem;
  background: var(--bg);
  position: sticky;
  bottom: 0;
}
.composer-row { display: flex; gap: 0.6rem; align-items: flex-end; }
.composer textarea {
  flex: 1;
  resize: none;
  min-height: 44px;
  max-height: 220px;
  padding: 0.6em 0.85em;
  font: inherit;
  font-size: 0.95rem;
  line-height: 1.5;
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 5px;
  outline: none;
  font-family: var(--font-family-body);
  transition: border-color 0.25s var(--ease-out-expo);
}
.composer textarea:focus { border-color: var(--text); }
.composer-actions { display: flex; gap: 0.4rem; }
.composer-actions .btn { padding: 0.55em 1.1em; font-size: 0.85rem; min-width: 72px; }
.composer-hint {
  font-size: 0.72rem;
  color: var(--text-tertiary);
  margin-top: 0.5rem;
  display: flex;
  gap: 0.8rem;
}
.composer-hint kbd {
  font-family: var(--font-family-mono);
  font-size: 0.85em;
  padding: 0.05em 0.4em;
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 3px;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 1rem;
  padding: 4rem 1rem;
  text-align: center;
  color: var(--text-secondary);
}
.empty-state h2 {
  font-family: var(--font-family-display);
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.empty-state h2::before {
  content: "";
  width: 40px;
  height: 2px;
  background: var(--accent);
}
.empty-state p { max-width: 380px; font-size: 0.9rem; }
.suggestions { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-top: 0.8rem; }
.suggestion {
  padding: 0.45em 0.85em;
  font-size: 0.82rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s var(--ease-spring);
  font: inherit;
}
.suggestion:hover {
  color: var(--accent);
  border-color: var(--accent);
  transform: translateY(-1px);
}

.toast {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%) translateY(12px);
  background: var(--text);
  color: var(--bg);
  padding: 0.6em 1.1em;
  border-radius: 4px;
  font-size: 0.85rem;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s var(--ease-out-expo), transform 0.3s var(--ease-spring);
  z-index: 200;
}
.toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* ====== Responsive ====== */
@media (max-width: 768px) {
  .container { padding: 0 1rem; }
  .chat-layout { padding: 0 1rem; }
  .hero { padding: 3rem 0 2rem; }
  .hero h1 { font-size: 1.8rem; }
  .block h2 { font-size: 1.3rem; }
  .site-nav { gap: 1rem; }
  .feature-grid { grid-template-columns: 1fr; }
  .chat-toolbar { gap: 0.5rem; }
  .chat-toolbar select { max-width: none; }
  .chat-toolbar .spacer { display: none; }
  .composer-actions { flex-direction: column-reverse; }
  .composer-actions .btn { width: 100%; }
  .cta-row { flex-direction: column; }
  .cta-row .btn { width: 100%; }
  .site-header .container { gap: 0.5rem; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`

export const THEME_INIT_SCRIPT = `
(function(){
  try {
    var stored = localStorage.getItem('nim-proxy-theme');
    var mode = stored || 'system';
    var actual;
    if (mode === 'system') {
      actual = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      actual = mode;
    }
    document.documentElement.setAttribute('data-theme', actual);
    document.documentElement.setAttribute('data-theme-mode', mode);
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.setAttribute('data-theme-mode', 'light');
  }
})();
`

export const THEME_TOGGLE_SCRIPT = `
(function(){
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', function(){
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    document.documentElement.setAttribute('data-theme-mode', next);
    try { localStorage.setItem('nim-proxy-theme', next); } catch(e){}
  });
})();
`

export function sharedHead(title: string, extraCss?: string): string {
  return `<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="NVIDIA NIM API reverse proxy running on Cloudflare Workers" />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23FF3B00'/%3E%3C/svg%3E" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap" />
<script>${THEME_INIT_SCRIPT}</script>
<style>${SHARED_CSS}${extraCss ? `\n${extraCss}` : ''}</style>`
}

export function siteHeader(active: 'helper' | 'chat' | 'stats', extra?: string): string {
  const navItems: Array<{ key: 'helper' | 'chat' | 'stats'; href: string; label: string }> = [
    { key: 'helper', href: '/', label: 'Helper' },
    { key: 'chat', href: '/chat', label: 'Chat' },
    { key: 'stats', href: '/stats', label: 'Stats' },
  ]
  const navHtml = navItems
    .map((n) => `<a href="${n.href}" class="nav-link${n.key === active ? ' active' : ''}">${n.label}</a>`)
    .join('')
  const toggle = `<button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme" title="Toggle theme"><span class="moon">☾</span><span class="sun">☀</span></button>`
  return `<header class="site-header"><div class="container"><a href="/" class="site-logo">nim-proxy</a><nav class="site-nav">${navHtml}</nav>${extra ? `<div style="display:flex;align-items:center;gap:0.5rem">${extra}${toggle}</div>` : toggle}</div></header>`
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
