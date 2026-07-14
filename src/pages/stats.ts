import { sharedHead, siteHeader, THEME_TOGGLE_SCRIPT } from './shared'

const STATS_CSS = `
/* ====== Stats hero metrics ====== */
.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0 2.5rem;
}
.metric-card {
  padding: 1.2rem 1.4rem 1.3rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  position: relative;
  overflow: hidden;
  transition: border-color 0.35s var(--ease-out-expo),
    transform 0.35s var(--ease-spring),
    box-shadow 0.35s var(--ease-out-expo);
}
.metric-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px var(--accent-soft);
}
.metric-card::before {
  content: "";
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: 2px;
  background: var(--accent);
  opacity: 0.55;
  transition: opacity 0.35s var(--ease-out-expo);
}
.metric-card:hover::before { opacity: 1; }
.metric-card.is-warn::before { background: var(--accent); opacity: 1; }
.metric-card.is-warn .metric-value { color: var(--accent); }
.metric-label {
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin-bottom: 0.55rem;
  display: flex;
  align-items: center;
  gap: 0.4em;
}
.metric-value {
  font-family: var(--font-family-display);
  font-size: 2.1rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--text);
  line-height: 1.1;
  transition: color 0.3s var(--ease-out-expo);
}
.metric-value.is-zero { color: var(--text-tertiary); }
.metric-sub {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
  font-family: var(--font-family-mono);
  letter-spacing: 0;
}

/* ====== Charts ====== */
.chart-card {
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
  background: var(--bg);
}
.chart-row {
  display: grid;
  grid-template-columns: minmax(160px, 1.5fr) 3fr minmax(90px, auto);
  gap: 1rem;
  align-items: center;
  padding: 0.7rem 1.1rem;
  border-bottom: 1px solid var(--border);
  font-size: 0.88rem;
  transition: background 0.2s var(--ease-out-expo);
}
.chart-row:last-child { border-bottom: none; }
.chart-row:hover { background: var(--bg-soft); }
.chart-label {
  font-family: var(--font-family-mono);
  font-size: 0.82rem;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chart-bar {
  height: 6px;
  background: var(--code-bg);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}
.chart-fill {
  height: 100%;
  background: var(--accent);
  width: 0;
  transition: width 0.7s var(--ease-out-expo);
  border-radius: 3px;
}
.chart-value {
  font-family: var(--font-family-mono);
  font-size: 0.82rem;
  color: var(--text-secondary);
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.chart-empty {
  padding: 2.5rem 1rem;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 0.88rem;
}
.chart-empty code {
  font-size: 0.85em;
}

/* ====== Keys list ====== */
.keys-card {
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
  background: var(--bg);
}
.key-row {
  display: grid;
  grid-template-columns: minmax(80px, auto) auto 1fr auto;
  gap: 1.2rem;
  align-items: center;
  padding: 0.8rem 1.1rem;
  border-bottom: 1px solid var(--border);
  font-size: 0.88rem;
  transition: background 0.2s var(--ease-out-expo);
}
.key-row:last-child { border-bottom: none; }
.key-row:hover { background: var(--bg-soft); }
.key-id {
  font-family: var(--font-family-mono);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text);
}
.key-stats {
  display: flex;
  gap: 1.2rem;
  font-family: var(--font-family-mono);
  font-size: 0.82rem;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}
.key-stats .err { color: var(--accent); }
.key-stats .err.is-zero { color: var(--text-tertiary); }
.key-stats .divider {
  color: var(--border);
  user-select: none;
}

/* ====== Status indicators ====== */
.status {
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
}
.status-healthy { color: var(--accent); }
.status-healthy .status-dot {
  background: var(--accent);
  animation: pulse-dot 2.6s var(--ease-power) infinite;
}
.status-cooldown { color: var(--text-secondary); }
.status-cooldown .status-dot {
  background: transparent;
  border: 1.5px solid var(--text-tertiary);
}
.status-unknown { color: var(--text-tertiary); }
.status-unknown .status-dot { background: var(--text-tertiary); }
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 0 var(--accent-soft); }
  60% { box-shadow: 0 0 0 6px transparent; }
}

/* ====== Error summary ====== */
.error-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.4rem;
}
.error-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  padding: 0.35em 0.75em;
  font-family: var(--font-family-mono);
  font-size: 0.82rem;
  border: 1px solid var(--border);
  border-radius: 3px;
  color: var(--text-secondary);
  background: var(--bg);
  transition: all 0.25s var(--ease-out-expo);
}
.error-chip.has-errors {
  border-color: var(--accent);
  color: var(--accent);
}
.error-chip-count { font-weight: 600; }
.error-empty {
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  color: var(--text-tertiary);
  font-size: 0.88rem;
}
.error-empty::before {
  content: "✓";
  color: var(--accent);
  font-weight: 700;
}

/* ====== Refresh bar ====== */
.refresh-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin: 2.5rem 0 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
  font-size: 0.78rem;
  color: var(--text-tertiary);
  flex-wrap: wrap;
}
.refresh-info {
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  flex-wrap: wrap;
}
.refresh-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  animation: pulse-dot 2s var(--ease-power) infinite;
}
.refresh-dot.is-stale { background: var(--text-tertiary); animation: none; }
.refresh-divider { color: var(--border); user-select: none; }
.refresh-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 0.4em 0.9em;
  border-radius: 4px;
  cursor: pointer;
  font: inherit;
  font-size: 0.78rem;
  transition: all 0.25s var(--ease-out-expo);
}
.refresh-btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}
.refresh-btn:disabled { opacity: 0.5; cursor: wait; }

/* ====== Error banner ====== */
.banner {
  margin: 1rem 0;
  padding: 0.8rem 1rem;
  border: 1px solid var(--accent);
  border-left-width: 2px;
  border-radius: 4px;
  color: var(--accent);
  font-size: 0.85rem;
  background: var(--bg);
  display: none;
}
.banner.show { display: block; animation: fade-up 0.4s var(--ease-out-expo); }

/* ====== Loading ====== */
.loading-row {
  padding: 0.7rem 1.1rem;
  border-bottom: 1px solid var(--border);
}
.loading-row:last-child { border-bottom: none; }
.skeleton {
  height: 8px;
  background: linear-gradient(90deg,
    var(--code-bg) 0%,
    var(--bg-soft) 50%,
    var(--code-bg) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.6s linear infinite;
  border-radius: 3px;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ====== Responsive ====== */
@media (max-width: 768px) {
  .stats-summary { grid-template-columns: repeat(2, 1fr); gap: 0.6rem; }
  .metric-value { font-size: 1.7rem; }
  .chart-row {
    grid-template-columns: 1fr;
    gap: 0.35rem;
    padding: 0.8rem 1rem;
  }
  .chart-bar { order: 3; }
  .chart-value { text-align: left; }
  .key-row {
    grid-template-columns: 1fr;
    gap: 0.4rem;
    padding: 0.85rem 1rem;
  }
  .key-stats { gap: 0.8rem; }
  .refresh-bar { font-size: 0.75rem; }
}

@media (prefers-reduced-motion: reduce) {
  .metric-card,
  .feature-card,
  .chart-fill,
  .status-dot,
  .refresh-dot,
  .skeleton {
    animation: none !important;
    transition-duration: 0.01ms !important;
  }
}
`

const STATS_SCRIPT = `
${THEME_TOGGLE_SCRIPT}

(function(){
  var REFRESH_MS = 5000;
  var el = {
    total: document.getElementById('m-total'),
    totalSub: document.getElementById('m-total-sub'),
    stream: document.getElementById('m-stream'),
    streamSub: document.getElementById('m-stream-sub'),
    errors: document.getElementById('m-errors'),
    errorsSub: document.getElementById('m-errors-sub'),
    keys: document.getElementById('m-keys'),
    keysSub: document.getElementById('m-keys-sub'),
    models: document.getElementById('models-list'),
    keysList: document.getElementById('keys-list'),
    errorsList: document.getElementById('errors-list'),
    uptime: document.getElementById('uptime'),
    updated: document.getElementById('updated'),
    refreshDot: document.getElementById('refresh-dot'),
    refreshBtn: document.getElementById('refresh-btn'),
    banner: document.getElementById('banner')
  };

  var state = { lastFetch: 0, inFlight: false };

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }
  function fmt(n){
    if (n == null || isNaN(n)) return '0';
    return String(Math.round(n)).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');
  }
  function pct(p, t){
    if (!t) return '0%';
    return (p / t * 100).toFixed(1) + '%';
  }
  function relTime(iso){
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  }
  function durationSince(iso){
    if (!iso) return '—';
    var ms = Date.now() - new Date(iso).getTime();
    if (ms < 0 || isNaN(ms)) return '—';
    var s = Math.floor(ms / 1000);
    if (s < 60) return s + 's';
    var m = Math.floor(s / 60);
    if (m < 60) return m + 'm';
    var h = Math.floor(m / 60);
    if (h < 24) return h + 'h ' + (m % 60) + 'm';
    var d = Math.floor(h / 24);
    return d + 'd ' + (h % 24) + 'h';
  }
  function ratePerHour(total, startedIso){
    if (!total || !startedIso) return null;
    var ms = Date.now() - new Date(startedIso).getTime();
    if (ms <= 0) return null;
    var hours = ms / 3600000;
    if (hours < 0.01) return Math.round(total * 36000 / ms) + ' / min';
    return Math.round(total / hours).toLocaleString() + ' / hr';
  }

  function setText(node, text){
    if (!node) return;
    if (node.textContent !== text) node.textContent = text;
  }
  function setNumber(node, value){
    if (!node) return;
    var v = String(value);
    if (node.textContent !== v) {
      node.textContent = v;
      node.classList.toggle('is-zero', parseFloat(v.replace(/,/g, '')) === 0);
    }
  }
  function setWarn(card, on){
    if (!card) return;
    card.classList.toggle('is-warn', !!on);
  }

  function render(data){
    var total = data.total_requests || 0;
    var stream = data.stream_requests || 0;
    var errors = (data.errors && data.errors.total) || 0;
    var keys = data.keys || {};
    var models = data.models || {};
    var keyIds = Object.keys(keys);
    var healthy = keyIds.filter(function(k){ return keys[k].healthy; }).length;
    var errRate = total > 0 ? (errors / total * 100) : 0;

    setNumber(el.total, fmt(total));
    setText(el.totalSub, ratePerHour(total, data.uptime) || 'since startup');
    setNumber(el.stream, fmt(stream));
    setText(el.streamSub, total > 0 ? pct(stream, total) + ' of total' : 'no requests yet');
    setNumber(el.errors, fmt(errors));
    setText(el.errorsSub, total > 0 ? errRate.toFixed(2) + '% error rate' : '—');
    setWarn(el.errors && el.errors.parentNode, errors > 0);
    setNumber(el.keys, healthy + '/' + keyIds.length);
    setText(el.keysSub, keyIds.length === 0 ? 'no keys' :
      (healthy === keyIds.length ? 'all healthy' :
       (keyIds.length - healthy) + ' in cooldown'));
    setWarn(el.keys && el.keys.parentNode, healthy < keyIds.length);

    // Models chart
    var entries = Object.keys(models).map(function(k){ return [k, models[k]]; });
    entries.sort(function(a, b){ return b[1] - a[1]; });
    if (entries.length === 0) {
      el.models.innerHTML = '<div class="chart-empty">暂无请求 · Worker 已运行 ' + esc(durationSince(data.uptime)) + '</div>';
    } else {
      var max = entries[0][1];
      el.models.innerHTML = entries.map(function(e){
        var w = max > 0 ? (e[1] / max * 100).toFixed(1) : 0;
        return '<div class="chart-row">' +
          '<div class="chart-label" title="' + esc(e[0]) + '">' + esc(e[0]) + '</div>' +
          '<div class="chart-bar"><div class="chart-fill" data-w="' + w + '" style="width:0%"></div></div>' +
          '<div class="chart-value">' + fmt(e[1]) + '</div>' +
          '</div>';
      }).join('');
      requestAnimationFrame(function(){
        Array.prototype.forEach.call(el.models.querySelectorAll('.chart-fill'), function(f){
          f.style.width = f.getAttribute('data-w') + '%';
        });
      });
    }

    // Keys
    if (keyIds.length === 0) {
      el.keysList.innerHTML = '<div class="chart-empty">没有可用的 API Key</div>';
    } else {
      el.keysList.innerHTML = keyIds.map(function(kid){
        var ks = keys[kid];
        var errCount = (data.errors && data.errors.byKey && data.errors.byKey[kid]) || 0;
        var statusHtml;
        if (ks.healthy) {
          statusHtml = '<span class="status status-healthy"><span class="status-dot"></span>healthy</span>';
        } else if (ks.cooldownUntil) {
          var ts = new Date(ks.cooldownUntil).getTime();
          statusHtml = '<span class="status status-cooldown" data-cd="' + ts + '"><span class="status-dot"></span>cooldown · <span class="cd-text">…</span></span>';
        } else {
          statusHtml = '<span class="status status-unknown"><span class="status-dot"></span>unknown</span>';
        }
        return '<div class="key-row">' +
          '<div class="key-id">' + esc(kid) + '</div>' +
          '<div>' + statusHtml + '</div>' +
          '<div></div>' +
          '<div class="key-stats">' +
            '<span>' + fmt(ks.requests) + ' req</span>' +
            '<span class="divider">·</span>' +
            '<span class="err ' + (errCount > 0 ? '' : 'is-zero') + '">' + fmt(errCount) + ' err</span>' +
          '</div>' +
          '</div>';
      }).join('');
    }

    // Errors
    var byKey = (data.errors && data.errors.byKey) || {};
    var errorEntries = Object.keys(byKey).map(function(k){ return [k, byKey[k]]; }).filter(function(e){ return e[1] > 0; });
    if (errors === 0) {
      el.errorsList.innerHTML = '<div class="error-empty">无错误记录</div>';
    } else {
      var parts = ['<div class="error-summary">'];
      parts.push('<div class="error-chip has-errors"><span>Total</span><span class="error-chip-count">' + fmt(errors) + '</span></div>');
      errorEntries.sort(function(a, b){ return b[1] - a[1]; }).forEach(function(e){
        parts.push('<div class="error-chip has-errors"><span>' + esc(e[0]) + '</span><span class="error-chip-count">' + fmt(e[1]) + '</span></div>');
      });
      parts.push('</div>');
      el.errorsList.innerHTML = parts.join('');
    }

    if (el.uptime) el.uptime.textContent = 'Started ' + relTime(data.uptime) + ' · running ' + durationSince(data.uptime);
    hideBanner();
  }

  function updateCooldowns(){
    var now = Date.now();
    Array.prototype.forEach.call(document.querySelectorAll('[data-cd]'), function(node){
      var ts = parseInt(node.getAttribute('data-cd'), 10);
      var remaining = Math.max(0, Math.ceil((ts - now) / 1000));
      var txt = node.querySelector('.cd-text');
      if (txt) txt.textContent = remaining > 0 ? remaining + 's' : 'ready';
      if (remaining <= 0) {
        node.outerHTML = '<span class="status status-healthy"><span class="status-dot"></span>healthy</span>';
      }
    });
  }

  function showBanner(msg){
    if (!el.banner) return;
    el.banner.textContent = msg;
    el.banner.classList.add('show');
  }
  function hideBanner(){
    if (el.banner) el.banner.classList.remove('show');
  }

  function updateUpdated(){
    if (!el.updated) return;
    if (!state.lastFetch) { el.updated.textContent = '等待首次更新…'; return; }
    var sec = Math.floor((Date.now() - state.lastFetch) / 1000);
    if (sec === 0) el.updated.textContent = '刚刚更新';
    else if (sec < 60) el.updated.textContent = sec + ' 秒前更新';
    else el.updated.textContent = Math.floor(sec / 60) + ' 分钟前更新';
    if (el.refreshDot) el.refreshDot.classList.toggle('is-stale', sec > 15);
  }

  async function fetchData(){
    if (state.inFlight) return;
    state.inFlight = true;
    if (el.refreshBtn) el.refreshBtn.disabled = true;
    try {
      var resp = await fetch('/stats', {
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json' }
      });
      if (resp.status === 401) {
        window.location.href = '/chat?next=/stats';
        return;
      }
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      var data = await resp.json();
      render(data);
      state.lastFetch = Date.now();
    } catch (err) {
      showBanner('更新失败 · ' + (err && err.message ? err.message : err));
    } finally {
      state.inFlight = false;
      if (el.refreshBtn) el.refreshBtn.disabled = false;
    }
  }

  if (el.refreshBtn) el.refreshBtn.addEventListener('click', fetchData);
  document.addEventListener('visibilitychange', function(){
    if (!document.hidden) fetchData();
  });

  fetchData();
  setInterval(function(){
    if (!document.hidden) fetchData();
  }, REFRESH_MS);
  setInterval(function(){
    if (document.hidden) return;
    updateUpdated();
    updateCooldowns();
  }, 1000);
})();
`

export function statsPageHTML(): string {
  const skeleton = (rows: number) =>
    Array.from({ length: rows })
      .map(() => '<div class="loading-row"><div class="skeleton" style="width: 80%"></div></div>')
      .join('')

  return `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light" data-theme-mode="system">
<head>${sharedHead('nim-proxy · stats', STATS_CSS)}</head>
<body>
${siteHeader('stats', `<form method="POST" action="/chat/logout" style="display:inline"><button type="submit" class="btn btn-sm btn-ghost" aria-label="退出登录">退出</button></form>`)}

<main class="container">
  <section class="hero">
    <h1>运行状态</h1>
    <p class="lede">实时统计 · 每 5 秒自动刷新 · 数据存储于 Worker 内存，重启或重新部署后归零。</p>
  </section>

  <div id="banner" class="banner" role="alert"></div>

  <section class="block">
    <div class="stats-summary">
      <div class="metric-card">
        <div class="metric-label">Total Requests</div>
        <div class="metric-value is-zero" id="m-total">—</div>
        <div class="metric-sub" id="m-total-sub">—</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Stream Requests</div>
        <div class="metric-value is-zero" id="m-stream">—</div>
        <div class="metric-sub" id="m-stream-sub">—</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Errors</div>
        <div class="metric-value is-zero" id="m-errors">—</div>
        <div class="metric-sub" id="m-errors-sub">—</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Healthy Keys</div>
        <div class="metric-value is-zero" id="m-keys">—</div>
        <div class="metric-sub" id="m-keys-sub">—</div>
      </div>
    </div>
  </section>

  <section class="block">
    <h2>Models</h2>
    <div class="chart-card" id="models-list">${skeleton(3)}</div>
  </section>

  <section class="block">
    <h2>API Keys</h2>
    <div class="keys-card" id="keys-list">${skeleton(2)}</div>
  </section>

  <section class="block">
    <h2>Errors</h2>
    <div id="errors-list"><div class="chart-empty">加载中…</div></div>
  </section>

  <div class="refresh-bar">
    <span class="refresh-info">
      <span class="refresh-dot" id="refresh-dot"></span>
      <span id="uptime">—</span>
      <span class="refresh-divider">·</span>
      <span id="updated">等待首次更新…</span>
    </span>
    <button id="refresh-btn" type="button" class="refresh-btn">立即刷新</button>
  </div>
</main>

<script>${STATS_SCRIPT}</script>
</body>
</html>`
}
