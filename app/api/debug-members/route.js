import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

// Temporary debug endpoint — remove after diagnosing board directory issue
export async function GET(request) {
  const notion = new Client({ auth: process.env.NOTION_API_KEY })
  const dbId = process.env.NOTION_MEMBERS_DB
  const results = {}

  results.envCheck = {
    hasApiKey: !!process.env.NOTION_API_KEY,
    apiKeyPrefix: process.env.NOTION_API_KEY?.substring(0, 8) + '...',
    membersDbId: dbId || 'MISSING',
    meetingsDbId: process.env.NOTION_MEETINGS_DB || 'MISSING',
  }

  // Test 1: Query WITHOUT any filter
  try {
    const noFilter = await notion.databases.query({
      database_id: dbId,
      page_size: 5,
    })
    results.noFilterQuery = {
      success: true,
      totalResults: noFilter.results.length,
      hasMore: noFilter.has_more,
      firstPageProps: noFilter.results[0]
        ? Object.keys(noFilter.results[0].properties)
        : 'NO RESULTS',
      firstPageTitle: noFilter.results[0]
        ? noFilter.results[0].properties['Board Member']
        : null,
    }
  } catch (e) {
    results.noFilterQuery = {
      success: false,
      error: e.message,
      code: e.code,
      status: e.status,
    }
  }

  // Test 2: Query WITH Status filter (what fetchBoardMembers uses)
  try {
    const withFilter = await notion.databases.query({
      database_id: dbId,
      filter: {
        property: 'Status',
        status: {
          equals: 'Current Board Member',
        },
      },
      page_size: 5,
    })
    results.statusFilterQuery = {
      success: true,
      totalResults: withFilter.results.length,
      hasMore: withFilter.has_more,
      firstPageTitle: withFilter.results[0]
        ? withFilter.results[0].properties['Board Member']
        : null,
    }
  } catch (e) {
    results.statusFilterQuery = {
      success: false,
      error: e.message,
      code: e.code,
      status: e.status,
    }
  }

  // Test 3: Try to retrieve the database itself
  try {
    const db = await notion.databases.retrieve({ database_id: dbId })
    results.databaseRetrieve = {
      success: true,
      title: db.title?.[0]?.plain_text || 'no title',
      propertyNames: Object.keys(db.properties),
      hasStatusProp: !!db.properties['Status'],
      statusPropType: db.properties['Status']?.type || 'NOT FOUND',
    }
  } catch (e) {
    results.databaseRetrieve = {
      success: false,
      error: e.message,
      code: e.code,
      status: e.status,
    }
  }

  return NextResponse.json(results, { status: 200 })
}
