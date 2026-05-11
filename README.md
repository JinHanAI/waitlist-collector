# @jinhan/waitlist-collector

Drop-in waitlist email collection for Vercel projects. Stores emails via Vercel Blob — no database setup, no external services.

## Quick Start

### 1. Install

```bash
npm install github:JinHanAI/waitlist-collector
```

### 2. Create API route

```js
// api/waitlist.js
import { createWaitlistHandler } from '@jinhan/waitlist-collector'
export default createWaitlistHandler()
```

### 3. Configure Vercel (one-time)

1. Go to your Vercel project → **Storage** → create a **Blob Store** (free, 250MB)
2. Connect it to your project
3. Add environment variable: `ADMIN_KEY` = your secret password
4. Deploy

That's it. Users can now submit emails via `POST /api/waitlist`.

## API Reference

### `createWaitlistHandler(options?)`

Returns a Vercel Serverless Function handler.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `adminKey` | `string` | `process.env.ADMIN_KEY` | Password for querying collected emails |
| `blobPrefix` | `string` | `'waitlist/'` | Blob storage path prefix |
| `validateEmail` | `(email: string) => boolean` | Built-in regex | Custom email validation |

### Endpoints

#### `POST /api/waitlist`

Submit an email.

```bash
curl -X POST https://your-site.com/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Response: {"success":true,"message":"Added to waitlist"}
```

- Validates email format
- Deduplicates (same email overwrites)
- Returns `{ success: true }` or `{ error: string }`

#### `GET /api/waitlist?admin_key=xxx`

Query all collected emails (requires admin password).

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

## Frontend Example

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

## Custom Configuration

```js
import { createWaitlistHandler } from '@jinhan/waitlist-collector'

export default createWaitlistHandler({
  // Custom storage prefix (useful if multiple waitlists share one Blob Store)
  blobPrefix: 'beta-signups/',

  // Restrict to company emails only
  validateEmail: (email) => email.endsWith('@yourcompany.com'),

  // Hardcoded admin key (not recommended — prefer environment variables)
  adminKey: process.env.MY_CUSTOM_KEY,
})
```

## Requirements

- **Vercel** deployment (uses Vercel Serverless Functions + Vercel Blob)
- **Node.js** >= 18
- A **Vercel Blob Store** connected to your project
- `ADMIN_KEY` environment variable set in Vercel

## Cost

Free. Vercel Blob's Hobby plan includes 250MB storage at no charge.

---

Built by [JinHanAI](https://github.com/JinHanAI) | [chinamodelapi.com](https://chinamodelapi.com)
