import 'dotenv/config';

async function trigger() {
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!hookUrl) {
    console.warn('VERCEL_DEPLOY_HOOK_URL not set. Skipping deploy trigger.');
    return;
  }

  const res = await fetch(hookUrl, { method: 'POST' });
  if (res.ok) {
    console.log('Vercel deploy triggered successfully');
  } else {
    console.error('Deploy trigger failed:', res.status, await res.text());
  }
}

trigger().catch(console.error);
