/**
 * File: api/activity/set.ts
 * Purpose: Vercel serverless API route to log "activity" updates into Supabase (optional).
 * Note: Discord "Activity" is actually set client-side through the Embedded App SDK.
 */

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    const {
      discord_user_id,
      details,
      state,
      buttons,
    }: { discord_user_id?: string; details?: string; state?: string; buttons?: any } = req.body || {};

    if (!discord_user_id) {
      res.status(400).json({ ok: false, error: 'Missing discord_user_id' });
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      res.status(500).json({ ok: false, error: 'Supabase env vars not set' });
      return;
    }

    const upsertResp = await fetch(`${supabaseUrl}/rest/v1/activities`, {
      method: 'POST',
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        discord_user_id,
        details,
        state,
        buttons,
      }),
    });

    if (!upsertResp.ok) {
      const t = await upsertResp.text();
      res.status(500).json({ ok: false, error: 'Supabase insert failed', details: t });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'Server error' });
  }
}
