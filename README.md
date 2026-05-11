# @jinhan/waitlist-collector

Drop-in waitlist email collection for Vercel projects. Stores emails via Vercel Blob — no database setup, no external services.

即插即用的 Waitlist 邮箱收集工具，专为 Vercel 项目设计。通过 Vercel Blob 存储邮箱 — 无需数据库、无需外部服务。

---

## Quick Start / 快速开始

### 1. Install / 安装

```bash
npm install github:JinHanAI/waitlist-collector
```

### 2. Create API route / 创建 API 路由

```js
// api/waitlist.js
import { createWaitlistHandler } from '@jinhan/waitlist-collector'
export default createWaitlistHandler()
```

### 3. Configure Vercel (one-time) / 配置 Vercel（一次性）

1. Go to your Vercel project → **Storage** → create a **Blob Store** (free, 250MB)
   进入 Vercel 项目 → **Storage** → 创建 **Blob Store**（免费，250MB）
2. Connect it to your project / 将其连接到你的项目
3. Add environment variable: `ADMIN_KEY` = your secret password
   添加环境变量：`ADMIN_KEY` = 你的管理密码
4. Deploy / 部署

That's it. Users can now submit emails via `POST /api/waitlist`.

搞定。用户通过 `POST /api/waitlist` 提交邮箱即可。

---

## API Reference / API 参考

### `createWaitlistHandler(options?)`

Returns a Vercel Serverless Function handler. / 返回一个 Vercel Serverless Function 处理器。

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `adminKey` | `string` | `process.env.ADMIN_KEY` | Password for querying collected emails / 查询邮箱的管理密码 |
| `blobPrefix` | `string` | `'waitlist/'` | Blob storage path prefix / Blob 存储路径前缀 |
| `validateEmail` | `(email: string) => boolean` | Built-in regex / 内置正则 | Custom email validation / 自定义邮箱验证 |

### Endpoints / 接口

#### `POST /api/waitlist` — Submit email / 提交邮箱

```bash
curl -X POST https://your-site.com/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Response: {"success":true,"message":"Added to waitlist"}
```

- Validates email format / 验证邮箱格式
- Deduplicates (same email overwrites) / 自动去重（相同邮箱覆盖）
- Returns `{ success: true }` or `{ error: string }`

#### `GET /api/waitlist?admin_key=xxx` — Query all emails / 查询所有邮箱

```bash
curl https://your-site.com/api/waitlist?admin_key=your_password

# Response:
# {
#   "total": 2,
#   "waitlist": [
#     { "email": "user1@example.com", "signedUpAt": "2026-05-11T10:00:00.000Z" },
#     { "email": "user2@example.com", "signedUpAt": "2026-05-11T11:00:00.000Z" }
#   ]
# }
```

---

## Frontend Example / 前端示例

```html
<form id="waitlist-form">
  <input type="email" id="email" placeholder="Enter your email" required>
  <button type="submit">Join Waitlist</button>
</form>

<script>
document.getElementById('waitlist-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;

  const res = await fetch('/api/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (res.ok) {
    alert("You're on the list!");
  }
});
</script>
```

---

## Custom Configuration / 自定义配置

```js
import { createWaitlistHandler } from '@jinhan/waitlist-collector'

export default createWaitlistHandler({
  // Custom storage prefix / 自定义存储前缀（多个 waitlist 共用同一个 Blob Store 时有用）
  blobPrefix: 'beta-signups/',

  // Restrict to company emails only / 限制仅公司邮箱可注册
  validateEmail: (email) => email.endsWith('@yourcompany.com'),

  // Custom admin key env var / 自定义管理密码环境变量
  adminKey: process.env.MY_CUSTOM_KEY,
})
```

---

## Requirements / 环境要求

- **Vercel** deployment (uses Vercel Serverless Functions + Vercel Blob) / 部署在 Vercel 上
- **Node.js** >= 18
- A **Vercel Blob Store** connected to your project / 已连接 Vercel Blob Store
- `ADMIN_KEY` environment variable set in Vercel / 在 Vercel 中设置 `ADMIN_KEY` 环境变量

## Cost / 费用

Free. Vercel Blob's Hobby plan includes 250MB storage at no charge.

免费。Vercel Blob 的 Hobby 计划包含 250MB 免费存储。

---

Built by [JinHanAI](https://github.com/JinHanAI) | [chinamodelapi.com](https://chinamodelapi.com)
