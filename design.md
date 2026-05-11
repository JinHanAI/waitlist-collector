# waitlist-collector 设计文档

## 概述

将 ChinaModelAPI 项目中的 waitlist 邮箱收集功能抽取为独立 npm 包 `@jinhan/waitlist-collector`，公开发布到 npmjs.com + GitHub 公开仓库，供所有 Vercel 项目复用。

## 目标

1. **项目解耦** — 从 ChinaModelAPI 中独立出来，不依赖任何业务代码
2. **极简接入** — 新项目安装包 + 3 行代码即可使用
3. **品牌曝光** — npm 包 + GitHub 仓库公开展示 JinHanAI 品牌
4. **AI 友好** — 提供 `AGENTS.md`，让 AI 编程助手能快速帮开发者接入
5. **隐私安全** — 包内零业务数据，敏感信息全部通过环境变量传入

## 包结构

```
waitlist-collector/
├── src/
│   └── index.js          # createWaitlistHandler 函数
├── package.json
├── README.md             # 人类读的文档（npm 展示页）
├── AGENTS.md             # AI 编程助手读的接入指南
├── LICENSE               # Apache 2.0
└── .gitignore
```

## 核心 API

### `createWaitlistHandler(options?)`

创建一个 Vercel Serverless Function handler。

**参数（全部可选）：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `adminKey` | `string` | `process.env.ADMIN_KEY` | 管理查询密码 |
| `blobPrefix` | `string` | `'waitlist/'` | Blob 存储路径前缀 |
| `validateEmail` | `(email: string) => boolean` | 内置正则 | 自定义邮箱验证函数 |

**返回：** `(req: VercelRequest, res: VercelResponse) => Promise<void>`

### 使用示例

```js
// api/waitlist.js — 最简用法
import { createWaitlistHandler } from '@jinhan/waitlist-collector'
export default createWaitlistHandler()
```

```js
// api/waitlist.js — 自定义配置
import { createWaitlistHandler } from '@jinhan/waitlist-collector'
export default createWaitlistHandler({
  blobPrefix: 'early-access/',
  validateEmail: (email) => email.endsWith('@company.com')
})
```

## 功能清单

| 功能 | 端点 | 说明 |
|------|------|------|
| 提交邮箱 | `POST /api/waitlist` | 格式校验 + 去重存储，返回 `{ success: true }` |
| 查询邮箱 | `GET /api/waitlist?admin_key=xxx` | 密码验证 + 返回 `{ total, waitlist }` |
| CORS | 所有响应 | 自动设置跨域头 |
| OPTIONS 预检 | `OPTIONS /api/waitlist` | 浏览器跨域预检 |

## 前置条件（每个项目一次性配置）

1. Vercel 项目里创建 Blob Store 并连接（免费）
2. 设置 `ADMIN_KEY` 环境变量
3. 安装依赖：`npm install @jinhan/waitlist-collector`

## 文件设计

### README.md — 给人读的

标准 npm 包文档，包含：
- 一句话介绍
- 安装命令
- 3 步快速接入指南
- API 参数说明
- 示例代码
- 品牌信息：Built by [JinHanAI](https://github.com/JinHanAI) | [chinamodelapi.com](https://chinamodelapi.com)

### AGENTS.md — 给 AI 读的

专门为 AI 编程助手（Claude Code、Cursor、Copilot 等）设计的结构化文档，包含：

1. **包的用途** — 一句话说明这是什么
2. **接入清单** — AI 帮开发者接入时需要执行的步骤（精确到命令）
3. **API 签名** — 函数签名、参数类型、返回值
4. **常见错误排查** — 部署失败、Blob Store 未连接、环境变量缺失等
5. **安全注意事项** — 不要硬编码密码、环境变量必须设置

设计原则：
- 纯文本 + Markdown 表格，AI 解析零歧义
- 步骤编号、命令用代码块包裹
- 不含任何废话和修辞

### 隐私控制

| 规则 | 说明 |
|------|------|
| 无业务数据 | 包内不含任何 chinamodelapi.com 的用户数据、定价、模型信息 |
| 环境变量传参 | 密码、Blob Token 等全部通过环境变量注入 |
| 品牌信息有限 | README 只展示品牌名 + GitHub + 网站 URL，不暴露内部业务 |
| .gitignore | 排除 .env、node_modules |

## 发布信息

| 项 | 值 |
|------|------|
| npm 包名 | `@jinhan/waitlist-collector` |
| npm scope | `@jinhan`（需在 npmjs.com 注册 jinhan 账号或组织） |
| GitHub 仓库 | `JinHanAI/waitlist-collector`（公开） |
| LICENSE | Apache 2.0 |
| Node.js 要求 | >= 18（Vercel Serverless 默认） |
| 依赖 | `@vercel/blob` |

## 后续改造 ChinaModelAPI

包发布后，将当前项目的 `api/waitlist.js` 改为使用包：

```js
// 改造前（当前）
import { put, list } from '@vercel/blob';
// ... 70 行代码

// 改造后
import { createWaitlistHandler } from '@jinhan/waitlist-collector'
export default createWaitlistHandler()
```

## 不做的事（YAGNI）

- 不做前端组件（React/Vue 表单）
- 不做 CLI 脚手架（3 行代码已够简单）
- 不做邮件验证码发送
- 不做 Webhook 回调
- 不做导出 CSV（管理员可以直接从 JSON 复制）
- 不做用户分组/标签
