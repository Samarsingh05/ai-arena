import { NextResponse } from "next/server"
import { getSql } from "@/lib/db"

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "DATABASE_URL is not set", status: "missing_env" },
        { status: 500 }
      )
    }

    const sql = getSql()
    
    // Test connection
    await sql`SELECT 1`
    
    // Check if User table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
      )
    `
    
    const tableExists = tableCheck[0]?.exists || false
    
    return NextResponse.json({
      status: "connected",
      database_url_set: true,
      table_exists: tableExists,
      message: tableExists 
        ? "Database is working! Tables exist." 
        : "Database connected but tables don't exist. Please run setup-database.sql"
    })
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: error?.message || "Unknown error",
        status: "error",
        details: error?.stack
      },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"

