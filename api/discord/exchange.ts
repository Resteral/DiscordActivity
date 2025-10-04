/**
 * File: api/discord/exchange.ts
 * Purpose: Vercel serverless API route to exchange a Discord OAuth code for tokens,
 *          fetch the user, and upsert into Supabase via REST.
 * Security: Uses server-side env vars (never exposed to client).
 */

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    const {
      code,
      redirectUri,
    }: { code?: string; redirectUri?: string } = req.body || {};

    if (!code) {
      res.status(400).json({ ok: false, error: 'Missing code' });
      return;
    }

    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const fallbackRedirect = process.env.DISCORD_REDIRECT_URI;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!clientId || !clientSecret || !(redirectUri || fallbackRedirect)) {
      res.status(500).json({ ok: false, error: 'Discord env vars not set' });
      return;
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      res.status(500).json({ ok: false, error: 'Supabase env vars not set' });
      return;
    }

    // 1) Exchange code for token
    const tokenResp = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: (redirectUri || fallbackRedirect) as string,
      }),
    });

    if (!tokenResp.ok) {
      const t = await tokenResp.text();
      res.status(400).json({ ok: false, error: 'Token exchange failed', details: t });
      return;
    }

    const tokenJson = await tokenResp.json();
    const accessToken: string | undefined = tokenJson?.access_token;

    if (!accessToken) {
      res.status(400).json({ ok: false, error: 'No access_token in response' });
      return;
    }

    // 2) Fetch Discord user
    const userResp = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userResp.ok) {
      const t = await userResp.text();
      res.status(400).json({ ok: false, error: 'Failed to fetch user', details: t });
      return;
    }

    const userJson: { id: string; username: string; avatar?: string } = await userResp.json();
    const discordUserId = userJson.id;
    const username = userJson.username;
    const avatar = userJson.avatar
      ? `https://cdn.discordapp.com/avatars/${userJson.id}/${userJson.avatar}.png`
      : null;

    // 3) Upsert into Supabase via REST (service role)
    const upsertResp = await fetch(`${supabaseUrl}/rest/v1/profiles?on_conflict=discord_user_id`, {
      method: 'POST',
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        discord_user_id: discordUserId,
        username,
        avatar,
        last_seen: new Date().toISOString(),
      }),
    });

    if (!upsertResp.ok) {
      const t = await upsertResp.text();
      res.status(500).json({ ok: false, error: 'Supabase upsert failed', details: t });
      return;
    }

    res.status(200).json({
      ok: true,
      user: {
        discord_user_id: discordUserId,
        username,
        avatar,
      },
    });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'Server error' });
  }
}
