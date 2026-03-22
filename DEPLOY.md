# Deployment Guide

## Vercel + Supabase + Resend Setup

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor
3. Run the contents of `supabase-schema.sql` to create tables and insert sample data
4. Go to Project Settings > API
5. Copy the following values:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Resend Setup

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (kinker.ch) or use the default Resend domain
3. Create an API key
4. Copy the API key → `RESEND_API_KEY`

### 3. Vercel Deployment

#### Option A: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

#### Option B: Deploy via Git

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel Dashboard:
   - Project Settings > Environment Variables
   - Add all variables from `.env.example`

### 4. Environment Variables

Add these to Vercel Dashboard:

| Variable | Value | Type |
|----------|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Production, Preview, Development |
| `RESEND_API_KEY` | Your Resend API key | Production, Preview, Development |

### 5. Update Domain Settings (Resend)

If using a custom domain for emails:

1. In Resend Dashboard > Domains
2. Add and verify your domain (kinker.ch)
3. Update `RESEND_FROM_EMAIL` in Vercel env vars

### 6. Test the Deployment

After deployment, verify:

1. Homepage loads events from Supabase
2. Event detail pages work
3. Newsletter signup works (check Resend logs)
4. Contact form works

## Local Development

```bash
# Copy environment variables
cp .env.example .env.local

# Fill in your values in .env.local

# Install dependencies
npm install

# Run dev server
npm run dev
```

## Troubleshooting

### Events not loading
- Check Supabase connection in browser console
- Verify RLS policies are set correctly
- Check environment variables in Vercel

### Emails not sending
- Check Resend API key is correct
- Verify domain is verified (if using custom domain)
- Check Vercel function logs for errors

### Build errors
- Ensure all dependencies are installed
- Check TypeScript errors: `npx tsc --noEmit`
