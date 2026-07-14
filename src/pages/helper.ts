import { sharedHead, siteHeader, THEME_TOGGLE_SCRIPT } from './shared'

const HERO_SCRIPT = `
${THEME_TOGGLE_SCRIPT}

(function(){
  var list = document.getElementById('models-list');
  var status = document.getElementById('models-status');
  if (!list || !status) return;

  fetch('/v1/models', { credentials: 'same-origin' })
    .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(function(data){
      var models = (data && data.data) || [];
      if (!models.length) { status.textContent = '当前账号下未返回任何模型。'; return; }
      status.textContent = '共 ' + models.length + ' 个模型 · 来源 /v1/models';
      list.innerHTML = models
        .slice()
        .sort(function(a,b){ return (a.id||'').localeCompare(b.id||''); })
        .map(function(m){ return '<span class="model-chip">' + escapeHtml(m.id || '') + '</span>'; })
        .join('');
    })
    .catch(function(err){
      status.innerHTML = '拉取失败：' + escapeHtml(err.message || String(err)) + '。请检查 Worker 是否配置了 <code>NIM_API_KEYS</code>。';
    });
})();

function escapeHtml(s){return String(s).replace(/[&<>"']/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}
`

export function helperPageHTML(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light" data-theme-mode="system">
<head>${sharedHead('nim-proxy · helper')}</head>
<body>
${siteHeader('helper')}

<main class="container">
  <section class="hero">
    <h1>Cloudflare Workers 上运行的<br/>NVIDIA NIM 反向代理</h1>
    <p class="lede">一致性哈希负载均衡 · 熔断冷却 · 模型白名单 · SSE 流式透传。把多个 NVIDIA API Key 聚合成一个稳定、低延迟、可观测的入口。</p>
    <div class="cta-row">
      <a href="/chat" class="btn">打开 Chat →</a>
      <a href="/stats" class="btn btn-ghost">查看 Stats</a>
    </div>
  </section>

  <section class="block">
    <h2>核心特性</h2>
    <div class="feature-grid">
      <div class="feature-card">
        <span class="tag">Routing</span>
        <h3>一致性哈希</h3>
        <p>同一会话内相同 <code>prefix</code> 始终命中同一 Key，最大化 NVIDIA 侧缓存命中，降低重复推理成本。</p>
      </div>
      <div class="feature-card">
        <span class="tag">Reliability</span>
        <h3>熔断 &amp; 冷却</h3>
        <p>遇到 401 / 403 / 429 / 5xx 自动将对应 Key 放入冷却期，冷却结束后自动恢复。</p>
      </div>
      <div class="feature-card">
        <span class="tag">Resilience</span>
        <h3>多 Key 故障转移</h3>
        <p>单次请求最多换 Key 重试 3 次，失败后返回详细错误信息与 <code>request_id</code>。</p>
      </div>
      <div class="feature-card">
        <span class="tag">Streaming</span>
        <h3>SSE 完整透传</h3>
        <p>支持 <code>stream=true</code> 的 Server-Sent Events，不缓冲、不截断、不修改。</p>
      </div>
      <div class="feature-card">
        <span class="tag">Access</span>
        <h3>模型白名单</h3>
        <p>通过 <code>NIM_ALLOWED_MODELS</code> 控制允许的模型 ID，空则全部放行。</p>
      </div>
      <div class="feature-card">
        <span class="tag">Compat</span>
        <h3>OpenAI 兼容</h3>
        <p>完全兼容 OpenAI SDK，只需替换 <code>base_url</code>，其余请求格式不变。</p>
      </div>
    </div>
  </section>

  <section class="block">
    <h2>快速接入</h2>
    <p>使用 <code>curl</code> 直接调用：</p>
    <pre><code>curl https://your-proxy.workers.dev/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_PROXY_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "meta/llama-3-8b-instruct",
    "messages": [{"role": "user", "content": "Hello"}]
  }'</code></pre>

    <p>使用 Python OpenAI SDK：</p>
    <pre><code>from openai import OpenAI

client = OpenAI(
    base_url="https://your-proxy.workers.dev/v1",
    api_key="dummy",
    default_headers={"Authorization": "Bearer YOUR_PROXY_TOKEN"},
)

resp = client.chat.completions.create(
    model="meta/llama-3-8b-instruct",
    messages=[{"role": "user", "content": "Hello"}],
    stream=True,
)
for chunk in resp:
    delta = chunk.choices[0].delta.content or ""
    print(delta, end="", flush=True)</code></pre>

    <p>流式响应支持 SSE，前端可直接使用 <code>fetch + ReadableStream</code> 逐 token 渲染。</p>
  </section>

  <section class="block">
    <h2>路由表</h2>
    <table class="route-table">
      <thead>
        <tr>
          <th>路径</th>
          <th>方法</th>
          <th>说明</th>
          <th>鉴权</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>/</code></td><td>GET</td><td>Helper 帮助页（本页）</td><td class="auth-no">否</td></tr>
        <tr><td><code>/chat</code></td><td>GET</td><td>Web 对话界面</td><td class="auth-yes">是</td></tr>
        <tr><td><code>/health</code></td><td>GET</td><td>健康检查</td><td class="auth-no">否</td></tr>
        <tr><td><code>/stats</code></td><td>GET</td><td>实时统计 JSON</td><td class="auth-yes">是</td></tr>
        <tr><td><code>/v1/models</code></td><td>GET</td><td>模型列表</td><td class="auth-no">否</td></tr>
        <tr><td><code>/v1/chat/completions</code></td><td>POST</td><td>对话补全</td><td class="auth-yes">是</td></tr>
        <tr><td><code>/v1/completions</code></td><td>POST</td><td>文本补全</td><td class="auth-yes">是</td></tr>
        <tr><td><code>/v1/embeddings</code></td><td>POST</td><td>向量嵌入</td><td class="auth-yes">是</td></tr>
        <tr><td><code>/v1/ranking</code></td><td>POST</td><td>重排序</td><td class="auth-yes">是</td></tr>
        <tr><td><code>/v1/*/status/*</code></td><td>GET</td><td>状态透传</td><td class="auth-no">否</td></tr>
      </tbody>
    </table>
  </section>

  <section class="block">
    <h2>支持模型</h2>
    <p class="models-status" id="models-status">正在从 <code>/v1/models</code> 拉取…</p>
    <div id="models-list" class="models-list"></div>
  </section>
</main>

<footer class="site-footer">
  <div class="container">
    <p>部署于 Cloudflare Workers · 一致性哈希 + 熔断 + SSE · MIT License</p>
  </div>
</footer>

<script>${HERO_SCRIPT}</script>
</body>
</html>`
}
