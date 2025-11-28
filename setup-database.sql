-- Setup script for Supabase/PostgreSQL
-- Run this in your Supabase SQL Editor

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Create ApiKey table
CREATE TABLE IF NOT EXISTS "ApiKey" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  provider TEXT NOT NULL,
  "encryptedKey" TEXT NOT NULL,
  status TEXT DEFAULT 'connected',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Create UsageLog table
CREATE TABLE IF NOT EXISTS "UsageLog" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  "tokensIn" INTEGER NOT NULL,
  "tokensOut" INTEGER NOT NULL,
  "costEstimate" REAL NOT NULL,
  "leftPercent" REAL NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Create Account table (for NextAuth - not used but required)
CREATE TABLE IF NOT EXISTS "Account" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
  UNIQUE(provider, "providerAccountId")
);

-- Create Session table (for NextAuth - not used but required)
CREATE TABLE IF NOT EXISTS "Session" (
  id TEXT PRIMARY KEY,
  "sessionToken" TEXT UNIQUE NOT NULL,
  "userId" TEXT NOT NULL,
  expires TIMESTAMP NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Create VerificationToken table (for NextAuth - not used but required)
CREATE TABLE IF NOT EXISTS "VerificationToken" (
  identifier TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires TIMESTAMP NOT NULL,
  UNIQUE(identifier, token)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_apikey_userid ON "ApiKey"("userId");
CREATE INDEX IF NOT EXISTS idx_apikey_provider ON "ApiKey"(provider);
CREATE INDEX IF NOT EXISTS idx_usagelog_userid ON "UsageLog"("userId");
CREATE INDEX IF NOT EXISTS idx_usagelog_timestamp ON "UsageLog"(timestamp);

