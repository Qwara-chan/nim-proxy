# NIM Proxy

NIM Proxy 是一个运行在 [Cloudflare Workers](https://developers.cloudflare.com/workers/) 上的 NVIDIA NIM API 反向代理，提供流量负载均衡、API 密钥熔断/冷却、模型访问控制、全链路统计和 SSE 流式透传。

## 核心特性

- **一致性哈希负载均衡** — 同一 `(model, prefix)` 组合始终命中同一 Key，充分利用 NVIDIA 侧缓存，降低重复推理成本
- **熔断与自动重启（Cool-down）** — 遇到 `401/403/429/5xx` 时自动将对应 Key 放入冷却期，冷却结束后自动恢复
- **最多失败重试** — 一次请求可自动换 Key 重试多次，失败后返回详尽错误信息
- **模型白名单** — 通过 `NIM_ALLOWED_MODELS` 控制允许访问的模型列表，为空则全部放行
- **开放端点（Public）与受控端点（Auth）分离** — `/v1/models`、状态查询等轻量操作无需鉴权；推理接口可根据需要加 `Bearer` Token 保护
- **实时统计** — 提供 `/stats` 端点，展示总请求数、流式请求数、各模型/Key 的调用情况、Key 健康状态与冷却时间
- **SSE 流式透传** — 完整支持 `stream=true` 的 Server-Sent Events 转发，不中断不缓冲
- **CORS 全开放** — 默认允许跨域，可直接从浏览器调用
- **极简部署** — 单文件 Worker，无需外部数据库或依赖

## 架构总览

```
┌──────────────┐    Bearer Token     ┌──────────────────────────────────────┐
│  客户端        │ ──────────────────> │  NIM Proxy (Cloudflare Worker)       │
│              │<── stream / JSON ──── │  • 一致性哈希 (model + prefix)       │
│  OpenAI SDK  │                      │  • 熔断 + cooldown                   │
│  / cURL      │     Bearer Key_i     │  • 模型白名单                         │
└──────────────┘ ──────────────────> │  • 请求 / 错误统计                    │
                                    │  ┌─────────────────────────────────┐ │
                                    │  │ ConsistentHash Ring              │ │
                                    │  │  key_0 (healthy)                 │ │
                                    │  │  key_1 (cooldown 30s)            │ │
                                    │  │  key_2 (healthy)                 │ │
                                    │  └─────────────────────────────────┘ │
                                    └──────────────────────────────────────┘
                                                        │
                                                        ▼
                                          https://integrate.api.nvidia.com/v1
```

## 快速开始

### 前提条件

- [Node.js](https://nodejs.org/) >= 18（推荐 LTS）
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) >= 3.24
- 一个 Cloudflare 账号（免费 Plan 即可）
- 至少一个有效的 NVIDIA NIM API Key

### 1. 克隆 / 拉取代码

```bash
git clone https://github.com/<your-org>/nim-proxy.git
cd nim-proxy
```

### 2. 安装依赖

```bash
npm install
```

### 3. 本地开发

```bash
npm run dev
```

Wrangler 将在本地启动一个 Worker 实例（默认 `http://localhost:8787`），可直接测试：

```bash
curl http://localhost:8787/health
# → OK
```

### 4. 配置 Secrets

所有敏感配置通过 [Wrangler Secrets](https://developers.cloudflare.com/workers/wrangler/commands/#put) 管理，绝不要写入代码或 `wrangler.toml`。

```bash
wrangler secret put NIM_API_KEYS
# 交互式输入，多个 Key 用逗号分隔，例如：
# key_aaa,key_bbb,key_ccc

wrangler secret put PROXY_AUTH_TOKEN
# 设置一个强密码用于保护推理端点，留空则不校验
```

### 5. 可选：调整环境变量

在 `wrangler.toml` 的 `[vars]` 段中可调整以下参数（无需 Secret）：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `NIM_BASE_URL` | `https://integrate.api.nvidia.com/v1` | NVIDIA API 基地址 |
| `NIM_MAX_RETRIES` | `3` | 单次请求最多换 Key 重试次数（不含首次） |
| `NIM_KEY_COOLDOWN` | `60` | 遇到 `429/5xx` 后的冷却秒数 |
| `NIM_LOG_LEVEL` | `info` | `debug` 时可在本地 `wrangler dev` 控制台看到更多日志 |
| `NIM_REQUEST_TIMEOUT` | `30000` | 单次上游请求超时（毫秒） |
| `NIM_ALLOWED_MODELS` | 空（全部放行） | 允许访问的模型 ID，逗号分隔 |

### 6. 部署

```bash
npm run deploy
```

部署后会得到一个类似 `https://nim-proxy.<subdomain>.workers.dev` 的域名，即为你的 NIM Proxy 入口。

## 使用指南

### 认证

如果设置了 `PROXY_AUTH_TOKEN`，推理接口须在请求头中携带 Bearer Token：

```bash
curl https://your-proxy.workers.dev/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PROXY_TOKEN" \
  -d '{"model":"meta/llama-3-8b-instruct","messages":[{"role":"user","content":"Hello"}]}'
```

> `/v1/models`、`/v1/chat/completions/status/...` 以及 `/health`、`/stats` 不受此限制（`/stats` 本身也受 `PROXY_AUTH_TOKEN` 保护，详见路由说明）。

### 路由逻辑

| 请求路径 | 方法 | 路由行为 | 是否需要鉴权 |
|----------|------|-----------|--------------|
| `/` | GET | Helper 帮助页（特性、接入示例、模型列表） | 否 |
| `/chat` | GET | Web 对话界面（密码门） | 通过 Session Cookie |
| `/chat/login` | POST | 验证 `PROXY_AUTH_TOKEN`，写入 HttpOnly Cookie | 否 |
| `/chat/logout` | POST | 清除 Session Cookie | 否 |
| `/health` | GET | 固定返回 `OK`，用于健康检查 | 否 |
| `/stats` | GET | 实时统计可视化页面（`Accept: text/html`）或 JSON（其他 Accept） | 页面：Session Cookie；JSON：视 `PROXY_AUTH_TOKEN` 而定 |
| `/v1/models` | GET | 透传到 NIM | 否 |
| `/v1/chat/completions` | POST | 一致性哈希路由 | 视 `PROXY_AUTH_TOKEN` 而定 |
| `/v1/completions` | POST | 一致性哈希路由 | 视 `PROXY_AUTH_TOKEN` 而定 |
| `/v1/embeddings` | POST | 一致性哈希路由 | 视 `PROXY_AUTH_TOKEN` 而定 |
| `/v1/ranking` | POST | 一致性哈希路由 | 视 `PROXY_AUTH_TOKEN` 而定 |
| `/v1/*/status/*` | GET | 透传到 NIM（不经过哈希） | 否 |
| 其他 | ANY | 返回 `404` | — |

### Helper / Chat / Stats 页面

部署后直接访问 Worker 域名，会看到三张页面：

- **`/` Helper 帮助页**：公开访问，展示代理特性、curl / Python 接入示例、路由表，并自动从 `/v1/models` 拉取账号下可用模型。亮色 / 暗色主题切换 + 完整响应式。
- **`/chat` 聊天界面**：受 `PROXY_AUTH_TOKEN` 保护。首次访问会显示密码门，输入正确口令后浏览器写入 HttpOnly Session Cookie（有效期 7 天），后续访问直接进入对话。聊天 UI 支持：
  - 模型下拉（来自 `/v1/models`，拉取失败时回退到常见模型列表）
  - 系统提示词、温度、Max Tokens 调节
  - 流式（SSE）逐 token 渲染，可随时 Stop 中断（已渲染内容保留）
  - 多轮上下文持久化到 `localStorage`，刷新页面后恢复
  - 简单 Markdown 渲染（代码块、行内代码、加粗、换行）
- **`/stats` 统计面板**：受 `PROXY_AUTH_TOKEN` 保护（与 `/chat` 共享同一 Cookie 会话）。可视化展示：
  - 4 张核心指标卡（总请求 / 流式 / 错误 / 健康 Key），含 per-hour 速率、错误率、Key 状态
  - 模型调用量柱状图（CSS 绘制，自动按调用量降序排列）
  - API Key 实时状态（健康脉冲点 / 冷却倒计时 / 错误数）
  - 错误按 Key 维度拆分的 chip 列表
  - 每 5 秒自动刷新，支持手动刷新按钮 + "X 秒前更新" 指示器
  - 切到后台标签页时停止轮询，回来时立即拉取
  - 同 URL 的 JSON API（`curl -H "Accept: application/json" /stats`）仍保持原样返回统计 JSON

三张页面共用同一 Cookie 会话：从 `/chat` 登录后，`/stats` 直接放行；从 `/stats` 进入也会看到密码门（提交后跳回 `/stats`）。

Chat UI 与 Stats 面板发起请求时通过浏览器 Cookie 自动携带鉴权，无需在页面内暴露明文 Token。

> 内容协商：`/stats` 通过 `Accept` 区分响应格式 — 浏览器默认 `Accept: text/html,...` 返回页面，`Accept: application/json` 或 `*/*`（curl 默认）返回统计 JSON。

### 流式请求

完全支持 `stream: true`，SSE 事件不会经过任何缓冲或修改，直接透传。需在客户端正确设置 `Accept: text/event-stream` 并按 OpenAI SSE 协议解析。

### 统计报表

```bash
GET /stats
```

返回 JSON 示例：

```json
{
  "uptime": "2025-03-01T12:00:00.000Z",
  "total_requests": 15234,
  "stream_requests": 9801,
  "models": {
    "meta/llama-3-8b-instruct": 12000,
    "nvidia/nemotron-4-7b-instruct": 3234
  },
  "keys": {
    "key_0": { "requests": 6000, "healthy": true },
    "key_1": { "requests": 5000, "healthy": true, "cooldownUntil": "2025-03-01T12:30:00.000Z" },
    "key_2": { "requests": 4234, "healthy": true }
  },
  "errors": {
    "total": 12,
    "byKey": {
      "key_1": 5
    }
  }
}
```

> **注意**：统计信息存储在 Worker 内存中，实例重启或重新部署后会归零。如需持久化请对接 Cloudflare KV / Durable Objects。

## 开发与测试

### 类型检查

```bash
npm run typecheck
```

### 运行测试

```bash
npm test
```

### 项目结构

```
nim-proxy/
├── src/
│   ├── index.ts          # 入口，路由分发（HTTP METHOD / PATH）
│   ├── config.ts         # 环境变量解析 & 模型白名单校验
│   ├── auth.ts           # Bearer / Cookie 鉴权 & 401 响应
│   ├── consistentHash.ts # 一致性哈希环 & Key 生命周期管理
│   ├── proxy.ts          # 请求转发、流式透传、熔断 & 重试逻辑
│   ├── stats.ts          # 内存级请求/错误统计 & /stats 接口
│   ├── types.ts          # 全项目 TypeScript 类型定义
│   ├── utils.ts          # CORS headers 等小工具
│   └── pages/
│       ├── shared.ts     # 设计语言 CSS、Header、主题切换
│       ├── helper.ts     # /  Helper 帮助页模板
│       ├── chat.ts       # /chat 登录页 + 聊天 UI 模板
│       └── stats.ts      # /stats 可视化面板模板
├── wrangler.toml         # Cloudflare Workers 配置（运行时参数）
├── tsconfig.json         # TypeScript 配置
├── package.json
├── package-lock.json
├── .wrangler/            # 本地 dev 缓存（勿提交）
└── node_modules/
```

### 核心模块说明

#### `consistentHash/ts` — 一致性哈希环

核心数据结构是一个已排序的虚拟节点环（默认每个 Key 生成 100 个虚拟节点）。路由时取 `hash(model + ":" + prefix)` 在环上找到最近的健康节点，尽量跳过处于冷却期的 Key。

- **prefix 设计**：去掉消息列表中最后一条（当前用户轮次），保证同一会话内后续轮询仍命中同一 Key，提升 NVIDIA 侧 hit rate。
- **冷却机制**：遇到 `401/403` 赋予 `cooldown * 5` 秒冷却；`429/5xx` 赋予标准冷却时长。
- **自动恢复**：`findNearestNode` 访问时如果发现 `cooldownUntil < now`，自动将该 Key 标记为 `healthy: true`，无需额外调度。

#### `proxy/ts` — 转发与熔断

`proxyWithRouting` 负责：

1. 通过 `getRoute` 获取目标 Key
2. 构造上游请求，设置 `Authorization: Bearer <key>`
3. 在 `requestTimeout` 毫秒内完成，超时则抛错
4. 成功时记录统计词、递增请求计数；失败时进入熔断并触发 `getFailoverKey` 换 Key 重试
5. 重试耗尽后返回 `502`，携带 `request_id` 与末次错误摘要

#### `stats/ts` — 实时统计

统计变量存储在 Worker 全局作用域中（同一个隔离实例内多请求共享）。适用于对环境规模级做健康监控。生产环境如需长期存证，建议封装为 KV/Durable Objects 写入接口。

### Cloudflare Workers 账户配额参考

免费 Plan：
- 每日 10 万次请求
- 单请求 CPU 时间 10ms（入站）/ 5ms（外发 `fetch`）
- 出站请求无带宽限制，限 20 个并发连接

Pro Plan（约 $5/月）：
- 无限请求
- 单请求 CPU 时间 30ms / 30ms
- 并发连接数提升

若遇到 CPU 超限或连接被限，请先升级 Plan 或优化 `extractPrefix` 中原数据的长度。

## 常见问题

### Q: 多个 Key 但部分失效后如何处理？
A: 失效 Key 会自动被标记为异常并进入冷却期。冷却期结束后重新参与哈希环的路由。修改 `/stats` 可手动观察各 Key 状态。

### Q: 能否和 OpenAI SDK 兼容？
A: 完全兼容。只要将 `base_url` 替换为你的 Worker 域名，其余请求格式、模型名称、`stream` 行为不变。

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://nim-proxy.your-subdomain.workers.dev/v1",
    api_key="dummy-or-any-value",  # 由 Worker 级的 PROXY_AUTH_TOKEN 替代
    default_headers={"Authorization": "Bearer YOUR_PROXY_TOKEN"},
)
```

### Q: Worker 重启后统计清零怎么办？
A: 当前为预期行为。如需持久化，请将 `recordRequest` / `recordError` 扩展为写入 Cloudflare KV。

### Q: 如何防止 Key 暴露给客户端？
A: 所有出站请求在 Worker 内部拼接 `Authorization: Bearer <key>`，客户端仅能看到 Worker 域名。请确保 `PROXY_AUTH_TOKEN` 强度足够且勿暴露给无关人员。

## 安全说明

- **绝对不要** 将 `NIM_API_KEYS` 等 Secret 提交到 Git 仓库（本项目已配置 `.gitingore`）。
- 生产环境请**始终**设置 `PROXY_AUTH_TOKEN`，防止 Key 被滥用。
- 不要依赖单一 `PROXY_AUTH_TOKEN` 做硬性限流（Token 泄露后需立即轮换）。

## 路线图（Roadmap）

- [ ] 将 stats 数据接入 Cloudflare KV 持久化
- [ ] 增加 Prometheus 格式导出 `/metrics` 端点
- [ ] 支持基于 `keyId` 的请求级限速（Rate Limit Per Key）
- [ ] 支持 per-Key base_url 动态配置
- [ ] 可视化监控面板（基于 Grafana 或 Cloudflare Dashboard）

## 开源协议

MIT
