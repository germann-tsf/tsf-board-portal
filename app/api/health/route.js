import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

export const dynamic = 'force-dynamic' // Never cache health checks

export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    notion: { status: 'unknown' },
    env: { status: 'unknown' },
  }

  // Check required env vars
  const requiredVars = ['NOTION_API_KEY', 'NOTION_MEETINGS_DB', 'NOTION_MEMBERS_DB', 'PORTAL_PASSWORD']
  const missingVars = requiredVars.filter(v => !process.env[v])
  if (missingVars.length > 0) {
    checks.env = { status: 'fail', missing: missingVars }
    checks.status = 'degraded'
  } else {
    checks.env = { status: 'ok' }
  }

  // Ping Notion API
  try {
    const notion = new Client({ auth: process.env.NOTION_API_KEY })
    await notion.users.me({})
    checks.notion = { status: 'ok' }
  } catch (error) {
    checks.notion = { status: 'fail', error: error.message }
    checks.status = 'degraded'
  }

  const httpStatus = checks.status === 'ok' ? 200 : 503
  return NextResponse.json(checks, { status: httpStatus })
}
