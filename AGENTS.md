# AGENTS.md — AI Coding Assistant Integration Guide

This file is written for AI coding assistants (Claude Code, Cursor, Copilot, etc.) to help developers integrate this package quickly and correctly.

## What This Package Does

`@jinhan/waitlist-collector` provides a single function `createWaitlistHandler()` that returns a Vercel Serverless Function handler for collecting and querying waitlist emails. Storage uses Vercel Blob (file-based, no database needed).

## Integration Checklist

When a developer asks you to add waitlist email collection to their Vercel project, follow these steps in order:

### Step 1: Install the package

```bash
npm install @jinhan/waitlist-collector
```

### Step 2: Create the API route

Create file `api/waitlist.js` in the project root:

```js
import { createWaitlistHandler } from '@jinhan/waitlist-collector'
export default createWaitlistHandler()
```

If the project already has an `api/` directory, place the file there. The filename `waitlist.js` determines the API path: `/api/waitlist`.

### Step 3: Set up Vercel Blob Store

Instruct the developer to:
1. Go to https://vercel.com/dashboard
2. Open their project → **Storage** tab
3. Click **Create Database** → select **Blob** → **Public** access
4. Connect the store to their project

This automatically injects `BLOB_READ_WRITE_TOKEN` as an environment variable.

### Step 4: Set admin password

Add the `ADMIN_KEY` environment variable in Vercel:
- Go to **Settings** → **Environment Variables**
- Add: `ADMIN_KEY` = a secure password of their choice
- Apply to Production, Preview, and Development

### Step 5: Deploy

```bash
vercel --prod
```

### Step 6: Verify

Test with curl:

```bash
# Submit an email
curl -X POST https://their-site.com/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
# Expected: {"success":true,"message":"Added to waitlist"}

# Query all emails (use their actual ADMIN_KEY value)
curl https://their-site.com/api/waitlist?admin_key=THEIR_PASSWORD
# Expected: {"total":1,"waitlist":[{"email":"test@example.com","signedUpAt":"..."}]}
```

## API Signature

```typescript
function createWaitlistHandler(options?: {
  adminKey?: string;        // Default: process.env.ADMIN_KEY
  blobPrefix?: string;      // Default: 'waitlist/'
  validateEmail?: (email: string) => boolean;  // Default: built-in regex
}): (req: VercelRequest, res: VercelResponse) => Promise<void>
```

### Exported endpoints

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `POST` | `/api/waitlist` | Submit email | None |
| `GET` | `/api/waitlist?admin_key=xxx` | List all emails | `admin_key` query param |
| `OPTIONS` | `/api/waitlist` | CORS preflight | None |

### Request/Response formats

**POST body:**
```json
{ "email": "user@example.com" }
```

**POST success response (200):**
```json
{ "success": true, "message": "Added to waitlist" }
```

**POST error responses:**
```json
// 400 — invalid email
{ "error": "Valid email is required" }

// 500 — blob write failure
{ "error": "Failed to save", "detail": "..." }
```

**GET success response (200):**
```json
{
  "total": 2,
  "waitlist": [
    { "email": "user1@example.com", "signedUpAt": "2026-05-11T10:00:00.000Z" },
    { "email": "user2@example.com", "signedUpAt": "2026-05-11T11:00:00.000Z" }
  ]
}
```

**GET error response (401):**
```json
{ "error": "Unauthorized" }
```

## Common Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `500 "access must be 'public'"` | Blob Store was created as Private | Recreate the store with Public access |
| `500 "This blob already exists"` | `allowOverwrite` not set | Upgrade to latest version of this package |
| `500 "Failed to save"` with no detail | `BLOB_READ_WRITE_TOKEN` not set | Connect the Blob Store to the Vercel project |
| `FUNCTION_INVOCATION_FAILED` | Missing `@vercel/blob` dependency | Run `npm install @vercel/blob` |
| `401 Unauthorized` on GET | Wrong `admin_key` value | Check the `ADMIN_KEY` environment variable |

## Security Notes

- Never hardcode `ADMIN_KEY` in source code. Always use environment variables.
- The `BLOB_READ_WRITE_TOKEN` is auto-injected by Vercel when a Blob Store is connected. Do not commit it to git.
- Blob files are publicly accessible via URL (each email is stored as a public JSON file). If this is a concern, implement additional access control in the handler.
- The admin query endpoint (`GET`) is protected by password. Use a strong password.

## Dependencies

- **Runtime**: `@vercel/blob` (must be installed in the host project)
- **Platform**: Vercel Serverless Functions
- **Node.js**: >= 18
