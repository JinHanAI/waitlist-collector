import { put, list } from '@vercel/blob';

const DEFAULT_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Create a Vercel Serverless Function handler for waitlist email collection.
 *
 * @param {object} [options]
 * @param {string} [options.adminKey] - Admin password for querying emails. Defaults to ADMIN_KEY env var.
 * @param {string} [options.blobPrefix] - Blob storage path prefix. Defaults to 'waitlist/'.
 * @param {(email: string) => boolean} [options.validateEmail] - Custom email validation function.
 * @returns {(req: import('@vercel/node').VercelRequest, res: import('@vercel/node').VercelResponse) => Promise<void>}
 */
export function createWaitlistHandler(options = {}) {
    const {
        adminKey = process.env.ADMIN_KEY || 'changeme',
        blobPrefix = 'waitlist/',
        validateEmail = (email) => DEFAULT_EMAIL_REGEX.test(email),
    } = options;

    return async function handler(req, res) {
        // CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        // POST — submit email
        if (req.method === 'POST') {
            const { email } = req.body || {};

            if (!email || !validateEmail(email)) {
                return res.status(400).json({ error: 'Valid email is required' });
            }

            const normalizedEmail = email.toLowerCase().trim();
            const timestamp = new Date().toISOString();

            try {
                await put(`${blobPrefix}${normalizedEmail}.json`, JSON.stringify({
                    email: normalizedEmail,
                    signedUpAt: timestamp,
                }), {
                    access: 'public',
                    contentType: 'application/json',
                    addRandomSuffix: false,
                    allowOverwrite: true,
                });
            } catch (err) {
                console.error('Blob write error:', err.message);
                return res.status(500).json({ error: 'Failed to save', detail: err.message });
            }

            return res.status(200).json({ success: true, message: 'Added to waitlist' });
        }

        // GET — admin query
        if (req.method === 'GET') {
            const { admin_key } = req.query || {};

            if (admin_key !== adminKey) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            try {
                const { blobs } = await list({ prefix: blobPrefix });

                const entries = await Promise.all(
                    blobs.map(async (blob) => {
                        const resp = await fetch(blob.url);
                        return await resp.json();
                    })
                );

                return res.status(200).json({
                    total: entries.length,
                    waitlist: entries,
                });
            } catch (err) {
                console.error('Blob read error:', err.message);
                return res.status(500).json({ error: 'Failed to read waitlist', detail: err.message });
            }
        }

        return res.status(405).json({ error: 'Method not allowed' });
    };
}
