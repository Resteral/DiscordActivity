# Discord Activity Setup Guide

## 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name it "Zealot Hockey Tournaments"
4. Copy the **Application ID** (this is your Client ID)

## 2. Configure Rich Presence

1. In your Discord app settings, go to "Rich Presence"
2. Add artwork assets:
   - **Large Image**: `activity-default` (512x512px)
   - **Large Text**: "Zealot Hockey Tournament"
3. Save changes

## 3. Enable Activities

1. Go to "OAuth2" → "General"
2. Add redirect URL: `https://your-domain.com` (your Vercel deployment URL)
3. In "OAuth2 URL Generator", select scopes:
   - `identify`
   - `activities.write`
4. Copy the generated URL for testing

## 4. Embed in Discord

### Method A: Test in Discord Client
1. Use this URL format in any Discord channel:
   ```
   https://discord.com/activities/YOUR_APPLICATION_ID/YOUR_ACTIVITY_ID
   ```
2. Replace with your Application ID
3. The activity ID can be any string (e.g., "tournament-lobby")

### Method B: Embedded App (Advanced)
1. In Developer Portal, go to "Installation"
2. Enable "Guild Install" and "User Install"
3. Add these bot permissions:
   - `Use Embedded Activities`
   - `Send Messages`
   - `Use Slash Commands`

## 5. Environment Variables

Add to your Vercel environment:

```env
DISCORD_CLIENT_ID=your_application_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 6. Testing the Integration

1. **Connect**: Enter your Client ID in the Discord Activity panel
2. **Authorize**: Grant permissions when prompted
3. **Test Activity**: 
   - Create a tournament
   - Switch between setup/draft/bracket tabs
   - Check Discord presence updates in real-time

## Activity Features

- **Real-time Status**: Shows current tournament phase
- **Team Tracking**: Displays team count and progress
- **Join Buttons**: Direct links to tournament and bracket
- **Rich Presence**: Custom artwork and descriptions

## Troubleshooting

**Activity not showing?**
- Ensure you're using the app inside Discord
- Check that Client ID is correct
- Verify OAuth2 redirect URL matches your domain

**Authorization failing?**
- Check Discord Developer Portal OAuth2 settings
- Ensure `identify` and `activities.write` scopes are selected

**Presence not updating?**
- The app must be actively running in Discord
- Check browser console for SDK errors
- Verify network connectivity to Discord APIs

## Next Steps

1. Deploy to Vercel with environment variables
2. Test the full flow in Discord
3. Customize artwork and branding
4. Add tournament-specific activity states
