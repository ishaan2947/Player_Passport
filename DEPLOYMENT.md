# Deployment Guide

This guide explains how to deploy Explain My Game to production using Vercel (frontend) and Fly.io (backend).

---

## Overview

| Component | Platform | Branch | Environment |
|-----------|----------|--------|-------------|
| Frontend | Vercel | `develop` → Preview | Staging |
| Frontend | Vercel | `main` → Production | Production |
| Backend | Fly.io | `develop` → staging app | Staging |
| Backend | Fly.io | `main` → production app | Production |

---

## One-Time Setup (Human Required)

### 1. Fly.io Setup

#### Install Fly CLI
```bash
# macOS/Linux
curl -L https://fly.io/install.sh | sh

# Windows
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

#### Authenticate and Create Apps
```bash
# Login to Fly.io
fly auth login

# Create staging app
cd apps/api
fly launch --name explain-my-game-api-staging --no-deploy
fly postgres create --name emg-db-staging
fly postgres attach emg-db-staging --app explain-my-game-api-staging

# Create production app
fly launch --name explain-my-game-api-prod --no-deploy
fly postgres create --name emg-db-prod
fly postgres attach emg-db-prod --app explain-my-game-api-prod
```

#### Set Secrets for Each App
```bash
# Staging
fly secrets set \
  OPENAI_API_KEY="sk-..." \
  CLERK_SECRET_KEY="sk_test_..." \
  CLERK_PUBLISHABLE_KEY="pk_test_..." \
  SENTRY_DSN="https://..." \
  ENVIRONMENT="staging" \
  FRONTEND_URL="https://staging.your-domain.com" \
  --app explain-my-game-api-staging

# Production
fly secrets set \
  OPENAI_API_KEY="sk-..." \
  CLERK_SECRET_KEY="sk_live_..." \
  CLERK_PUBLISHABLE_KEY="pk_live_..." \
  SENTRY_DSN="https://..." \
  ENVIRONMENT="production" \
  FRONTEND_URL="https://your-domain.com" \
  --app explain-my-game-api-prod
```

#### Get Fly.io API Token
```bash
fly tokens create deploy -x 999999h
# Save this token - you'll add it to GitHub secrets
```

---

### 2. Vercel Setup

#### Install Vercel CLI
```bash
npm install -g vercel
```

#### Link Project
```bash
cd apps/web
vercel login
vercel link
# Follow prompts to create/link project
```

#### Get Vercel Credentials
After linking, find these in your project settings:
- **VERCEL_ORG_ID**: In `.vercel/project.json` or Vercel dashboard → Settings
- **VERCEL_PROJECT_ID**: In `.vercel/project.json` or Vercel dashboard → Settings
- **VERCEL_TOKEN**: Create at https://vercel.com/account/tokens

#### Set Environment Variables in Vercel Dashboard
Go to your project → Settings → Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://explain-my-game-api-staging.fly.dev` | Preview |
| `NEXT_PUBLIC_API_URL` | `https://explain-my-game-api-prod.fly.dev` | Production |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | Preview |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | Production |
| `CLERK_SECRET_KEY` | `sk_test_...` | Preview |
| `CLERK_SECRET_KEY` | `sk_live_...` | Production |
| `NEXT_PUBLIC_SENTRY_DSN` | `https://...` | All |

---

### 3. GitHub Secrets Setup

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

| Secret Name | Description | Where to Get |
|-------------|-------------|--------------|
| `FLY_API_TOKEN` | Fly.io deploy token | `fly tokens create deploy` |
| `FLY_APP_NAME_STAGING` | Staging app name | e.g., `explain-my-game-api-staging` |
| `FLY_APP_NAME_PRODUCTION` | Production app name | e.g., `explain-my-game-api-prod` |
| `VERCEL_TOKEN` | Vercel API token | https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | Vercel organization ID | `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Vercel project ID | `.vercel/project.json` |

---

## Deployment Flow

### Automatic Deployments

| Action | Result |
|--------|--------|
| Push to `develop` | Deploy to staging (Fly.io staging + Vercel preview) |
| Push to `main` | Run integration tests, then deploy to production |
| Pull Request | Run lint/build checks only (no deploy) |

### Manual Deployment

```bash
# Deploy backend to Fly.io manually
cd apps/api
fly deploy --app explain-my-game-api-prod

# Deploy frontend to Vercel manually
cd apps/web
vercel --prod
```

---

## Deployment Verification

After deployment, verify:

### Backend Health
```bash
curl https://explain-my-game-api-prod.fly.dev/health
# Expected: {"status":"healthy","environment":"production","version":"1.0.0"}
```

### Frontend Loads
Open your production URL in a browser.

### Authentication Works
Try signing in with Clerk.

### API Connection
Check browser console for any CORS or connection errors.

---

## Rollback

### Fly.io Rollback
```bash
# List releases
fly releases --app explain-my-game-api-prod

# Rollback to previous version
fly deploy --image registry.fly.io/explain-my-game-api-prod:vXX
```

### Vercel Rollback
Go to Vercel Dashboard → Deployments → Click on previous deployment → Promote to Production

---

## Monitoring

### Fly.io Logs
```bash
fly logs --app explain-my-game-api-prod
```

### Vercel Logs
Go to Vercel Dashboard → Deployments → Functions → View logs

### Sentry
Check https://sentry.io for error tracking.

---

## Troubleshooting

### Deployment Fails

1. **Check GitHub Actions logs** for specific error
2. **Verify secrets are set** in GitHub repository settings
3. **Check Fly.io status**: `fly status --app <app-name>`
4. **Check Vercel status**: Vercel Dashboard → Deployments

### 500 Errors After Deploy

1. **Check API logs**: `fly logs --app <app-name>`
2. **Verify database migrations ran**: `fly ssh console` → `alembic current`
3. **Check environment variables**: `fly secrets list --app <app-name>`

### CORS Errors

1. **Verify FRONTEND_URL** is set correctly in Fly.io secrets
2. **Check API CORS configuration** matches frontend domain

### Authentication Not Working

1. **Verify Clerk keys** are set in both frontend (Vercel) and backend (Fly.io)
2. **Check environment** (test keys for staging, live keys for production)
3. **Verify frontend and backend use matching Clerk environment**

---

## Cost Estimates

### Fly.io
- **Staging**: ~$0-5/month (using free tier)
- **Production**: ~$5-20/month (1 shared CPU, 256MB-512MB RAM)
- **Database**: ~$15-30/month (PostgreSQL)

### Vercel
- **Hobby (free)**: Works for staging/small production
- **Pro ($20/month)**: Better for production with more bandwidth

---

## Security Checklist

Before going live:

- [ ] All secrets use live (not test) Clerk keys in production
- [ ] ENVIRONMENT is set to "production" in Fly.io
- [ ] NODE_ENV is "production" in Vercel
- [ ] FRONTEND_URL matches actual production domain
- [ ] Sentry DSN is configured for error tracking
- [ ] HTTPS is enforced (automatic on both platforms)
- [ ] Database backups are configured

