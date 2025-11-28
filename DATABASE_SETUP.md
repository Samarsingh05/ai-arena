# Database Setup Guide

## Option 1: Supabase (Recommended - Free & Easy)

### Step 1: Create Supabase Account
1. Go to https://supabase.com
2. Sign up for free
3. Create a new project
4. Wait for it to be ready (takes ~2 minutes)

### Step 2: Get Connection String
1. In your Supabase project, go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Select **URI** format
4. Copy the connection string (looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`)
5. Replace `[YOUR-PASSWORD]` with your actual database password (shown when you created the project)

### Step 3: Create Tables
1. In Supabase, go to **SQL Editor**
2. Click **New query**
3. Copy and paste the contents of `setup-database.sql`
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

### Step 4: Add to Vercel
1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add:
   - **Name**: `DATABASE_URL`
   - **Value**: Your Supabase connection string
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

