const RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_TIMEOUT_MS = 5000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Notification timed out')), ms)),
  ]);
}

// Fire-and-await after a message is successfully stored (7.4) — awaited
// rather than fire-and-forget so a serverless deploy can't drop it after the
// response is sent, but this must NEVER throw: a notification failure must
// not turn a successfully stored message into a visitor-facing error. Every
// failure mode (unconfigured, network error, non-ok response, provider
// hang) is swallowed and logged instead.
//
// Gracefully skips (no-op) if RESEND_API_KEY / CONTACT_NOTIFY_EMAIL aren't
// set, the same pattern scripts/triggerDeploy.js already uses for an
// optional external integration.
export async function notifyOwnerOfMessage(message, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const apiKey = process.env.RESEND_API_KEY;
  const ownerEmail = process.env.CONTACT_NOTIFY_EMAIL;

  if (!apiKey || !ownerEmail) {
    console.warn('Contact notification skipped: RESEND_API_KEY or CONTACT_NOTIFY_EMAIL not set.');
    return;
  }

  try {
    const response = await withTimeout(
      fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.CONTACT_NOTIFY_FROM || 'Portfolio Contact <onboarding@resend.dev>',
          to: ownerEmail,
          subject: `New portfolio message: ${message.subject}`,
          text: `From: ${message.name} <${message.email}>\n\n${message.body}`,
        }),
      }),
      timeoutMs
    );

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error('Contact notification failed:', response.status, body);
    }
  } catch (err) {
    console.error('Contact notification failed:', err.message);
  }
}
