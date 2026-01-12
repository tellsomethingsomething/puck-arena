# Railway Deployment Setup

## Environment Variables Required

Set these in your Railway project dashboard:

### Required
- `JWT_SECRET` - Generate a secure random string (e.g., run `openssl rand -base64 32`)
- `ADMIN_EMAIL` - Admin login email (e.g., admin@puckarena.com)
- `ADMIN_PASSWORD` - Admin login password (change from default!)
- `NODE_ENV` - Set to `production`

### Optional
- `PORT` - Railway sets this automatically (usually 3000 or assigned port)
- `CORS_ORIGIN` - Comma-separated list of allowed origins (your Vercel frontend URLs)
  - Example: `https://arena.vercel.app,https://admin-puckarena.vercel.app`

## Deployment Command

Railway will automatically use the configuration from `railway.json`:
- Build: `pnpm build:shared && pnpm --filter @puck-arena/api build`
- Start: `pnpm --filter @puck-arena/api start`

## Database

Currently using SQLite (file-based). For production, consider upgrading to PostgreSQL:
1. Add Railway PostgreSQL plugin
2. Update DATABASE_URL environment variable
3. Update Drizzle config to use pg instead of better-sqlite3

## Post-Deployment

After deployment, you'll get a Railway URL like:
`https://your-project.up.railway.app`

Use this URL to configure your frontends:
- Arena: `VITE_API_URL` and `VITE_WS_URL`
- Admin: `VITE_API_URL`
