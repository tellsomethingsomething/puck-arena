# PuckArena Deployment Guide

## Architecture

- **Backend (API + WebSocket)**: Railway → Persistent connections for Socket.io
- **Arena Frontend**: Vercel → Static hosting
- **Admin Frontend**: Vercel → Static hosting (separate project)

## Current Status

✅ Code pushed to GitHub: `tellsomethingsomething/puck-arena`
✅ Railway project connected to GitHub
✅ Vercel project exists: `puck-arena`
🔄 Waiting for Railway deployment URL

## Deployment Steps

### 1. Railway Backend (API)

**Repository**: Already connected to `tellsomethingsomething/puck-arena`

**Environment Variables** (add these in Railway dashboard):
```
NODE_ENV=production
JWT_SECRET=R4Vo3fN88WcQXic3Tp8/Wbf4ifn9ZFjcujOF8kR0nIQ=
ADMIN_EMAIL=admin@puckarena.com
ADMIN_PASSWORD=YOUR_SECURE_PASSWORD_HERE
```

**Build Settings**: Automatically detected from `railway.json`
- Build: `pnpm build:shared && pnpm --filter @puck-arena/api build`
- Start: `pnpm --filter @puck-arena/api start`

**Get your API URL**:
1. Go to Settings → Networking → Public Networking
2. Copy the URL (e.g., `https://puck-arena-api.up.railway.app`)

### 2. Arena Frontend (Vercel)

**Project**: `puck-arena` (already linked)
**Config**: Uses `vercel.json` in root

**Environment Variables** (add in Vercel dashboard):
```
VITE_API_URL=https://YOUR-RAILWAY-URL.up.railway.app
VITE_WS_URL=wss://YOUR-RAILWAY-URL.up.railway.app
```

**Deploy Command**:
```bash
vercel --prod
```

### 3. Admin Frontend (Vercel - Separate Project)

**New Project**: Create `puck-arena-admin`
**Config**: Uses `vercel-admin.json`

**Environment Variables**:
```
VITE_API_URL=https://YOUR-RAILWAY-URL.up.railway.app
```

**Deploy Command**:
```bash
vercel --prod --name puck-arena-admin
```

### 4. Update Railway CORS

After getting Vercel URLs, update Railway environment:
```
CORS_ORIGIN=https://your-arena.vercel.app,https://your-admin.vercel.app
```

## Post-Deployment

1. Test Arena at: `https://puck-arena.vercel.app`
2. Test Admin at: `https://puck-arena-admin.vercel.app`
3. Verify WebSocket connection in browser console
4. Test admin login and puck management

## Mobile Compatibility

✅ Already optimized:
- Touch event handlers
- Viewport meta tags
- Responsive coordinates
- No-zoom configuration
- Full-screen canvas

## Monitoring

- Railway: Check logs and metrics in dashboard
- Vercel: Analytics and deployment logs
- Browser: Console for WebSocket connection status
