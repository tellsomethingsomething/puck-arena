# Vercel Environment Variables Setup

## Your Railway API URL
`https://puck-arenaapi-production-bb5c.up.railway.app`

## Arena Frontend Environment Variables

Go to: https://vercel.com/tomtellsos-projects/puck-arena/settings/environment-variables

### Add/Update these variables for **Production**:

1. **VITE_API_URL**
   - Value: `https://puck-arenaapi-production-bb5c.up.railway.app`
   - Environment: Production

2. **VITE_WS_URL**
   - Value: `wss://puck-arenaapi-production-bb5c.up.railway.app`
   - Environment: Production

## Admin Frontend (If separate project)

If you create a separate Vercel project for admin:

### Add this variable for **Production**:

1. **VITE_API_URL**
   - Value: `https://puck-arenaapi-production-bb5c.up.railway.app`
   - Environment: Production

## After Adding Variables

1. Go to Deployments tab
2. Find the latest deployment
3. Click "Redeploy" to apply new environment variables
4. Or just push a new commit to trigger automatic deployment

## Railway CORS Configuration

After you get your Vercel URLs, add this to Railway:

1. Go to: https://railway.com/project/e9086aeb-a315-45b8-93b7-7fba2831fe5a
2. Click on your API service
3. Go to Variables tab
4. Add new variable:
   - Name: `CORS_ORIGIN`
   - Value: `https://puck-arena-lwj4npilz-tomtellsos-projects.vercel.app,https://puck-arena.vercel.app,https://puck-arena-admin.vercel.app`

Replace with your actual Vercel production URLs.

## Current Vercel Production URL

Based on your deployments:
- Arena: `https://puck-arena-lwj4npilz-tomtellsos-projects.vercel.app`

## Testing

After configuration:
1. Visit your Vercel arena URL
2. Open browser console (F12)
3. Look for WebSocket connection: "Connected to server"
4. Tap the screen - pucks should respond
5. Open in another tab/device - multiplayer should work
