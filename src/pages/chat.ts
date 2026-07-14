import { sharedHead, siteHeader, escapeHtml, THEME_TOGGLE_SCRIPT } from './shared'

const CHAT_SCRIPT = `
${THEME_TOGGLE_SCRIPT}

(function(){
  var messagesEl = document.getElementById('messages');
  var form = document.getElementById('composer');
  var input = document.getElementById('input');
  var sendBtn = document.getElementById('send');
  var stopBtn = document.getElementById('stop');
  var modelSel = document.getElementById('model');
  var sysEl = document.getElementById('system-prompt');
  var tempEl = document.getElementById('temperature');
  var maxEl = document.getElementById('max-tokens');
  var clearBtn = document.getElementById('clear');
  var newBtn = document.getElementById('new');
  var emptyEl = document.getElementById('empty');
  var toastEl = document.getElementById('toast');
  if (!messagesEl || !form) return;

  var STORAGE_KEY = 'nim-proxy-chat-v1';
  var state = loadState();

  var currentController = null;
  var streaming = false;

  function loadState(){
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { messages: [], model: '' };
      var parsed = JSON.parse(raw);
      return { messages: Array.isArray(parsed.messages) ? parsed.messages : [], model: parsed.model || '' };
    } catch(e) { return { messages: [], model: '' }; }
  }
  function saveState(){
    try {
      var messages = state.messages.filter(function(m){ return m.role === 'user' || m.role === 'assistant'; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages: messages, model: state.model || modelSel.value }));
    } catch(e){}
  }

  function renderMessages(){
    while (messagesEl.firstChild) messagesEl.removeChild(messagesEl.firstChild);
    var hasAny = false;
    state.messages.forEach(function(m){
      if (m.role === 'system') return;
      hasAny = true;
      messagesEl.appendChild(buildMessageEl(m));
    });
    if (state.messages.length && emptyEl) emptyEl.style.display = 'none';
    else if (emptyEl) emptyEl.style.display = '';
    scrollToBottom();
  }

  function buildMessageEl(m){
    var wrap = document.createElement('div');
    wrap.className = 'msg msg-' + m.role;
    var head = document.createElement('div');
    head.className = 'msg-head';
    var role = document.createElement('span');
    role.className = 'role';
    role.textContent = m.role === 'user' ? 'You' : (m.role === 'assistant' ? 'Assistant' : m.role);
    head.appendChild(role);
    if (m.model) {
      var meta = document.createElement('span');
      meta.className = 'msg-meta';
      meta.textContent = m.model;
      head.appendChild(meta);
    }
    wrap.appendChild(head);

    var body = document.createElement('div');
    body.className = 'msg-body';
    if (m.error) {
      body.style.color = 'var(--accent)';
      body.textContent = m.error;
    } else {
      renderMarkdownInto(body, m.content || '');
      if (m.streaming) {
        var cur = document.createElement('span');
        cur.className = 'streaming-cursor';
        body.appendChild(cur);
      }
    }
    wrap.appendChild(body);
    return wrap;
  }

  function renderMarkdownInto(target, text){
    var codeBlocks = [];
    text = text.replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, function(_, code){
      var idx = codeBlocks.length;
      codeBlocks.push(code.replace(/^\\n|\\n$/g, ''));
      return '\\u0000CODEBLOCK_' + idx + '\\u0000';
    });
    var parts = text.split(/\\u0000CODEBLOCK_(\\d+)\\u0000/);
    for (var i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        var seg = parts[i];
        seg = seg.replace(/\`([^\`\\n]+)\`/g, function(_, c){
          return '<code>' + escapeHtml(c) + '</code>';
        });
        seg = seg.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
        appendTextWithBreaks(target, seg);
      } else {
        var pre = document.createElement('pre');
        var code = document.createElement('code');
        code.textContent = codeBlocks[parseInt(parts[i], 10)] || '';
        pre.appendChild(code);
        target.appendChild(pre);
      }
    }
  }

  function appendTextWithBreaks(target, text){
    var lines = text.split('\\n');
    lines.forEach(function(line, idx){
      target.appendChild(document.createTextNode(line));
      if (idx < lines.length - 1) target.appendChild(document.createElement('br'));
    });
  }

  function scrollToBottom(){
    requestAnimationFrame(function(){
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }

  function toast(msg){
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function(){ toastEl.classList.remove('show'); }, 1800);
  }

  function populateModels(){
    var fallback = [
      'meta/llama-3.1-70b-instruct',
      'meta/llama-3.1-8b-instruct',
      'meta/llama-3-70b-instruct',
      'meta/llama-3-8b-instruct',
      'nvidia/nemotron-4-340b-instruct',
      'mistralai/mixtral-8x7b-instruct-v0.1',
      'google/gemma-2-9b-it',
      'meta/codellama-70b-instruct'
    ];
    fetch('/v1/models', { credentials: 'same-origin' })
      .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
      .then(function(data){
        var ids = (data && data.data || []).map(function(m){ return m.id; }).filter(Boolean);
        if (!ids.length) throw new Error('empty');
        fillModelSelect(ids);
      })
      .catch(function(){
        fillModelSelect(fallback);
        toast('模型列表拉取失败，使用常见模型');
      });
  }

  function fillModelSelect(ids){
    var previous = state.model || modelSel.value;
    ids.sort();
    modelSel.innerHTML = '';
    ids.forEach(function(id){
      var opt = document.createElement('option');
      opt.value = id; opt.textContent = id;
      modelSel.appendChild(opt);
    });
    if (previous && ids.indexOf(previous) >= 0) modelSel.value = previous;
    else modelSel.value = ids[0];
    state.model = modelSel.value;
  }

  function autosize(){
    input.style.height = 'auto';
    input.style.height = Math.min(220, input.scrollHeight) + 'px';
  }

  function buildRequestBody(){
    var messages = [];
    var sys = (sysEl && sysEl.value || '').trim();
    if (sys) messages.push({ role: 'system', content: sys });
    state.messages.forEach(function(m){
      if (m.role === 'user' || m.role === 'assistant') {
        messages.push({ role: m.role, content: m.content || '' });
      }
    });
    var body = {
      model: modelSel.value,
      messages: messages,
      stream: true
    };
    var temp = parseFloat(tempEl.value);
    if (!isNaN(temp)) body.temperature = temp;
    var max = parseInt(maxEl.value, 10);
    if (!isNaN(max) && max > 0) body.max_tokens = max;
    return body;
  }

  function setStreaming(on){
    streaming = on;
    sendBtn.disabled = on;
    stopBtn.style.display = on ? '' : 'none';
    input.disabled = on;
    modelSel.disabled = on;
    tempEl.disabled = on;
    maxEl.disabled = on;
    if (!on) input.focus();
  }

  async function sendMessage(){
    if (streaming) return;
    var text = input.value.trim();
    if (!text) return;
    if (!modelSel.value) { toast('请先选择模型'); return; }

    var userMsg = { role: 'user', content: text };
    state.messages.push(userMsg);

    var assistantMsg = { role: 'assistant', content: '', model: modelSel.value, streaming: true };
    state.messages.push(assistantMsg);

    input.value = '';
    autosize();
    renderMessages();
    saveState();

    currentController = new AbortController();
    setStreaming(true);

    try {
      var resp = await fetch('/v1/chat/completions', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRequestBody()),
        signal: currentController.signal
      });

      if (!resp.ok) {
        var errText = '';
        try {
          var errJson = await resp.json();
          errText = (errJson && errJson.error && errJson.error.message) || JSON.stringify(errJson);
        } catch(e) {
          errText = await resp.text().catch(function(){ return ''; });
        }
        assistantMsg.streaming = false;
        assistantMsg.error = 'HTTP ' + resp.status + ' · ' + (errText || resp.statusText);
        renderMessages();
        saveState();
        toast('请求失败');
        return;
      }

      var reader = resp.body.getReader();
      var decoder = new TextDecoder();
      var buffer = '';
      while (true) {
        var read = await reader.read();
        if (read.done) break;
        buffer += decoder.decode(read.value, { stream: true });
        var lines = buffer.split('\\n');
        buffer = lines.pop() || '';
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i];
          if (!line.startsWith('data:')) continue;
          var data = line.slice(5).trim();
          if (!data || data === '[DONE]') continue;
          try {
            var json = JSON.parse(data);
            var delta = json.choices && json.choices[0] && json.choices[0].delta;
            if (delta && delta.content) {
              assistantMsg.content = (assistantMsg.content || '') + delta.content;
              renderMessages();
            }
          } catch(e) {}
        }
      }
      assistantMsg.streaming = false;
      renderMessages();
      saveState();
    } catch (err) {
      if (err && err.name === 'AbortError') {
        assistantMsg.streaming = false;
        if (!assistantMsg.content) {
          assistantMsg.content = '_已停止生成_';
          assistantMsg.error = true;
        }
        renderMessages();
        saveState();
        toast('已停止');
      } else {
        assistantMsg.streaming = false;
        assistantMsg.error = '网络错误: ' + (err && err.message || String(err));
        renderMessages();
        saveState();
        toast('连接中断');
      }
    } finally {
      currentController = null;
      setStreaming(false);
    }
  }

  function stopStreaming(){
    if (currentController) {
      currentController.abort();
    }
  }

  function clearAll(){
    if (streaming) { toast('请先停止当前生成'); return; }
    if (!state.messages.length) return;
    if (!confirm('清空所有对话？此操作不可撤销。')) return;
    state.messages = [];
    saveState();
    renderMessages();
  }

  function newConversation(){
    if (streaming) stopStreaming();
    state.messages = [];
    saveState();
    renderMessages();
    input.focus();
  }

  // Event listeners
  form.addEventListener('submit', function(e){
    e.preventDefault();
    sendMessage();
  });
  input.addEventListener('keydown', function(e){
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  });
  input.addEventListener('input', autosize);
  modelSel.addEventListener('change', function(){ state.model = modelSel.value; saveState(); });
  stopBtn.addEventListener('click', stopStreaming);
  if (clearBtn) clearBtn.addEventListener('click', clearAll);
  if (newBtn) newBtn.addEventListener('click', newConversation);

  document.querySelectorAll('.suggestion').forEach(function(btn){
    btn.addEventListener('click', function(){
      input.value = btn.textContent || '';
      autosize();
      input.focus();
    });
  });

  // Initial render
  populateModels();
  renderMessages();
  autosize();
  setTimeout(function(){ input.focus(); }, 50);
})();
`

export function loginPageHTML(errorMsg?: string, nextPath?: string): string {
  const errorBlock = errorMsg
    ? `<div class="auth-error" role="alert">⚠ ${escapeHtml(errorMsg)}</div>`
    : ''
  const safeNext = nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//') ? escapeHtml(nextPath) : '/chat'
  const subText = safeNext === '/stats'
    ? 'Stats 页面受密码保护，请输入 <code>PROXY_AUTH_TOKEN</code> 进入可视化面板。'
    : 'Chat 页面受密码保护，请输入 <code>PROXY_AUTH_TOKEN</code> 进入对话。'
  return `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light" data-theme-mode="system">
<head>${sharedHead('nim-proxy · 登录')}</head>
<body>
${siteHeader('chat')}
<main class="auth-page">
  <div class="auth-card">
    <h1>输入访问令牌</h1>
    <p class="auth-sub">${subText}</p>
    <form method="POST" action="/chat/login" autocomplete="off">
      <input type="hidden" name="next" value="${safeNext}" />
      <input
        type="password"
        name="token"
        class="input"
        placeholder="PROXY_AUTH_TOKEN"
        required
        autofocus
        aria-label="访问令牌"
      />
      <button type="submit" class="btn">进入 →</button>
      ${errorBlock}
    </form>
    <p class="auth-hint">提示：与 <code>/v1/*</code> 推理端点使用同一口令。验证通过后会在浏览器写入 HttpOnly 会话 Cookie，有效期 7 天。</p>
  </div>
</main>
<script>
${THEME_TOGGLE_SCRIPT}
(function(){
  var err = document.querySelector('.auth-error');
  if (err) {
    var input = document.querySelector('input[name="token"]');
    if (input) { input.value = ''; input.focus(); }
  }
})();
</script>
</body>
</html>`
}

export function chatUIHTML(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light" data-theme-mode="system">
<head>${sharedHead('nim-proxy · chat', `
  body { background: var(--bg); }
`)}</head>
<body>
${siteHeader('chat', `<form method="POST" action="/chat/logout" style="display:inline"><button type="submit" class="btn btn-sm btn-ghost" aria-label="退出登录">退出</button></form>`)}

<div class="chat-layout">
  <div class="chat-toolbar">
    <span class="toolbar-field">Model</span>
    <select id="model" aria-label="选择模型"></select>
    <span class="toolbar-field">Temp</span>
    <input type="number" id="temperature" value="0.7" step="0.1" min="0" max="2" aria-label="Temperature" />
    <span class="toolbar-field">Max</span>
    <input type="number" id="max-tokens" value="2048" step="64" min="1" aria-label="Max tokens" />
    <span class="toolbar-field">System</span>
    <input type="text" id="system-prompt" placeholder="可选 · 系统提示词" aria-label="系统提示词" />
    <span class="spacer"></span>
    <button id="new" type="button" class="btn btn-sm btn-ghost" title="开启新对话">新对话</button>
    <button id="clear" type="button" class="btn btn-sm btn-danger" title="清空历史">清空</button>
  </div>

  <div id="messages" class="messages" role="log" aria-live="polite">
    <div class="empty-state" id="empty">
      <h2>开始一次新的对话</h2>
      <p>选择一个模型，输入消息。流式响应会逐 token 渲染，可随时按 Stop 中断。</p>
      <div class="suggestions">
        <button class="suggestion" type="button">用一句话解释 Cloudflare Workers 的 isolate 模型</button>
        <button class="suggestion" type="button">写一个 Python 函数，扁平化嵌套列表</button>
        <button class="suggestion" type="button">对比 SQL JOIN 中的 INNER、LEFT、RIGHT 区别</button>
        <button class="suggestion" type="button">给一段日语自我介绍附上罗马音</button>
      </div>
    </div>
  </div>

  <form class="composer" id="composer" autocomplete="off">
    <div class="composer-row">
      <textarea
        id="input"
        placeholder="输入消息…"
        rows="1"
        aria-label="消息输入框"
      ></textarea>
      <div class="composer-actions">
        <button id="send" type="submit" class="btn">发送</button>
        <button id="stop" type="button" class="btn btn-ghost" style="display:none">停止</button>
      </div>
    </div>
    <div class="composer-hint">
      <span><kbd>Enter</kbd> 发送</span>
      <span><kbd>Shift</kbd>+<kbd>Enter</kbd> 换行</span>
    </div>
  </form>
</div>

<div class="toast" id="toast" role="status" aria-live="polite"></div>

<script>${CHAT_SCRIPT}</script>
</body>
</html>`
}
