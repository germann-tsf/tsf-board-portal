# TSF Board Portal - Deployment Guide

## Overview

This is a Next.js web app that pulls live data from your Notion workspace and displays it behind a shared password. Board members visit a clean URL, enter the password, and see meetings, documents, and member info without needing Notion accounts.

---

## Step 1: Create a Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Name it something like "TSF Board Portal"
4. Select the workspace that has your board data
5. Under Capabilities, enable "Read content" (that's all you need)
6. Click Submit
7. Copy the "Internal Integration Secret" (starts with `ntn_`). You'll need this later.

## Step 2: Share Your Notion Databases with the Integration

The app needs access to two databases: Meetings and Board Members.

1. Open the **Meetings** database in Notion
2. Click the "..." menu in the top-right corner
3. Click "Connections" then "Connect to" and select your "TSF Board Portal" integration
4. Repeat for the **Board Members** database

Without this step, the API will return "unauthorized" errors.

## Step 3: Push Code to GitHub

1. Create a new repository on GitHub (can be private)
2. From the `tsf-board-app` folder on your computer, run:

```
cd tsf-board-app
git init
git add .
git commit -m "Initial commit: TSF Board Portal"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tsf-board-portal.git
git push -u origin main
```

## Step 4: Deploy to Vercel

1. Go to https://vercel.com and sign up/log in with your GitHub account
2. Click "Add New Project"
3. Import your `tsf-board-portal` repository from GitHub
4. Vercel will auto-detect it's a Next.js project
5. Before clicking Deploy, expand "Environment Variables" and add these four:

| Variable Name        | Value                                        |
|----------------------|----------------------------------------------|
| `NOTION_API_KEY`     | Your integration secret from Step 1          |
| `NOTION_MEETINGS_DB` | `22984a2d-4690-80d2-8da4-000b1288b376`      |
| `NOTION_MEMBERS_DB`  | `22984a2d-4690-804c-9d6d-000b0b2a5ec1`      |
| `PORTAL_PASSWORD`    | Whatever password you want board members to use |

6. Click "Deploy"
7. Wait for the build to complete (usually 1-2 minutes)
8. Vercel gives you a URL like `tsf-board-portal.vercel.app`

## Step 5: Test It

1. Visit your Vercel URL
2. You should see the login page
3. Enter the password you set in `PORTAL_PASSWORD`
4. You should see the dashboard with live data from Notion

## Step 6 (Optional): Custom Domain

If you want a custom domain like `board.theshelterforum.org`:

1. In Vercel, go to your project Settings > Domains
2. Add your custom domain
3. Follow Vercel's instructions to update your DNS records
4. Vercel handles SSL automatically

---

## How It Works

The app fetches data from Notion every 60 seconds (cached). When a board member visits:

1. They enter the shared password (stored as a cookie for 30 days)
2. The app queries Notion's API for current meetings and board members
3. Data is displayed in the portal UI with sidebar navigation

When you update an agenda or add a meeting in Notion, the portal reflects the change within 60 seconds. No redeploy needed.

---

## Changing the Password

1. Go to Vercel > your project > Settings > Environment Variables
2. Edit `PORTAL_PASSWORD` to the new value
3. Click Save
4. Go to Deployments and click "Redeploy" on the latest deployment
5. Board members with old cookies will be redirected to login with the new password on their next visit (after their 30-day cookie expires, or if you change the cookie validation logic)

---

## Troubleshooting

**"Failed to fetch data" error after login**
Your Notion integration likely doesn't have access to the databases. Go back to Step 2 and make sure both databases are shared with the integration.

**Login page shows but password doesn't work**
Double-check the `PORTAL_PASSWORD` environment variable in Vercel. It's case-sensitive.

**Data seems stale**
The cache refreshes every 60 seconds. If you just made a change in Notion, wait a minute and refresh.

**Build fails on Vercel**
Check the build logs in Vercel. The most common issue is a missing environment variable.
