# Database Setup Guide

## Option 1: Supabase (Recommended - Free & Easy)

### Step 1: Create Supabase Account
1. Go to https://supabase.com
2. Sign up for free
3. Create a new project
4. Wait for it to be ready (takes ~2 minutes)

### Step 2: Get Connection String
1. **IMPORTANT**: Make sure your Supabase project is **active** (not paused)
   - If paused, go to your Supabase dashboard and click "Restore" or "Resume"
   
2. In your Supabase project, go to **Settings** → **Database**
3. Scroll down to **Connection string**
4. **For Vercel/serverless, use the "Connection pooling" option:**
   - Select **Connection pooling** tab
   - Select **Session mode**
   - Copy the connection string (looks like: `postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres`)
   - **OR** use **Transaction mode** if Session doesn't work
5. Replace `[YOUR-PASSWORD]` with your actual database password
   - If you forgot it, go to **Settings** → **Database** → **Database password** to reset it

### Step 3: Create Tables
1. In Supabase, go to **SQL Editor**
2. Click **New query**
3. Copy and paste the contents of `setup-database.sql`
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

### Step 4: Add to Vercel
1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add these two variables:

   **Variable 1:**
   - **Name**: `DATABASE_URL`
   - **Value**: Your Supabase connection string (from Transaction pooler)
   - **Environment**: Production, Preview, Development (select all)

   **Variable 2:**
   - **Name**: `NEXTAUTH_SECRET`
   - **Value**: Generate a random string (you can use: `openssl rand -base64 32` in terminal, or use https://generate-secret.vercel.app/32)
   - **Environment**: Production, Preview, Development (select all)

3. Save and redeploy

## Option 2: Vercel Postgres (If you prefer)

1. In Vercel dashboard, go to **Storage** tab
2. Click **Create Database** → **Postgres**
3. Create a new Postgres database
4. Go to **Settings** → **Environment Variables**
5. Vercel will automatically add `POSTGRES_URL` - you can use this as `DATABASE_URL`
6. Run the SQL script from `setup-database.sql` in Vercel's database dashboard

## Testing

After setup, try signing up/logging in. It should work!

