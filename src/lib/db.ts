import postgres from "postgres"

// Lazy connection - only create when needed
let sqlInstance: ReturnType<typeof postgres> | null = null

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set")
  }
  
  if (!sqlInstance) {
    sqlInstance = postgres(process.env.DATABASE_URL, {
      max: 1, // Single connection for serverless
      idle_timeout: 20,
      connect_timeout: 10,
    })
  }
  
  return sqlInstance
}

export { getSql }

// Simple ID generator (cuid-like)
function generateId() {
  return `c${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`
}

// Helper functions to replace Prisma queries
export const db = {
  // User operations
  async findUserByEmail(email: string) {
    const sql = getSql()
    const users = await sql`
      SELECT * FROM "User" WHERE email = ${email} LIMIT 1
    `
    return users[0] || null
  },

  async createUser(email: string, password: string) {
    const sql = getSql()
    const id = generateId()
    const now = new Date()
    await sql`
      INSERT INTO "User" (id, email, password, "createdAt")
      VALUES (${id}, ${email}, ${password}, ${now})
    `
    return { id, email, password, createdAt: now }
  },

  async getAllUsers() {
    const sql = getSql()
    return await sql`
      SELECT * FROM "User" ORDER BY "createdAt" DESC
    `
  },

  // API Key operations
  async findApiKeysByUserId(userId: string) {
    const sql = getSql()
    return await sql`
      SELECT * FROM "ApiKey" WHERE "userId" = ${userId}
    `
  },

  async findApiKeysByUserIdAndProviders(userId: string, providers: string[]) {
    const sql = getSql()
    return await sql`
      SELECT * FROM "ApiKey" 
      WHERE "userId" = ${userId} 
      AND provider = ANY(${providers})
    `
  },

  async findApiKeyByUserIdAndProvider(userId: string, provider: string) {
    const sql = getSql()
    const keys = await sql`
      SELECT * FROM "ApiKey" 
      WHERE "userId" = ${userId} AND provider = ${provider} 
      LIMIT 1
    `
    return keys[0] || null
  },

  async createApiKey(data: {
    userId: string
    provider: string
    encryptedKey: string
    status: string
  }) {
    const sql = getSql()
    const id = generateId()
    const now = new Date()
    await sql`
      INSERT INTO "ApiKey" (id, "userId", provider, "encryptedKey", status, "createdAt", "updatedAt")
      VALUES (${id}, ${data.userId}, ${data.provider}, ${data.encryptedKey}, ${data.status}, ${now}, ${now})
    `
    return { id, ...data, createdAt: now, updatedAt: now }
  },

  async updateApiKey(id: string, data: { encryptedKey: string; status: string }) {
    const sql = getSql()
    const now = new Date()
    await sql`
      UPDATE "ApiKey" 
      SET "encryptedKey" = ${data.encryptedKey}, 
          status = ${data.status}, 
          "updatedAt" = ${now}
      WHERE id = ${id}
    `
  },

  async deleteApiKey(id: string) {
    const sql = getSql()
    await sql`DELETE FROM "ApiKey" WHERE id = ${id}`
  },

  // Usage Log operations
  async findUsageLogs(userId: string, providers: string[], since: Date) {
    const sql = getSql()
    return await sql`
      SELECT * FROM "UsageLog" 
      WHERE "userId" = ${userId} 
      AND provider = ANY(${providers})
      AND timestamp >= ${since}
      ORDER BY timestamp DESC
    `
  },

  async createUsageLog(data: {
    userId: string
    provider: string
    model: string
    tokensIn: number
    tokensOut: number
    costEstimate: number
    leftPercent: number
  }) {
    const sql = getSql()
    const id = generateId()
    const now = new Date()
    await sql`
      INSERT INTO "UsageLog" (id, "userId", provider, model, "tokensIn", "tokensOut", "costEstimate", "leftPercent", timestamp)
      VALUES (${id}, ${data.userId}, ${data.provider}, ${data.model}, ${data.tokensIn}, ${data.tokensOut}, ${data.costEstimate}, ${data.leftPercent}, ${now})
    `
    return { id, ...data, timestamp: now }
  },
}
