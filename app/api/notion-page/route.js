import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import { fetchPageBlocks, fetchPageMeta } from '@/lib/notion'

export const revalidate = 300 // Revalidate every 5 minutes (keeps Notion file URLs fresh)

const notion = new Client({ auth: process.env.NOTION_API_KEY })

// Normalize a Notion ID by stripping hyphens so equality checks are robust
// against the two common formats Notion returns.
const normalizeId = (id) => (id || '').replace(/-/g, '')

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get('id')

    if (!pageId) {
      return NextResponse.json({ error: 'Missing page ID' }, { status: 400 })
    }

    // Defense in depth: if the requested page lives in the Meetings database,
    // require Published=true before returning content. Prevents draft agendas
    // from leaking via a direct /api/notion-page?id=<id> call.
    const meetingsDb = process.env.NOTION_MEETINGS_DB
    if (meetingsDb) {
      try {
        const page = await notion.pages.retrieve({ page_id: pageId })
        const parentDbId = page.parent?.database_id
        if (parentDbId && normalizeId(parentDbId) === normalizeId(meetingsDb)) {
          const isPublished = page.properties?.Published?.checkbox === true
          if (!isPublished) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
          }
        }
      } catch (e) {
        // If the retrieve fails (bad id, permissions), fall through — the
        // subsequent fetchPageMeta/fetchPageBlocks will surface the error.
      }
    }

    const [meta, blocks] = await Promise.all([
      fetchPageMeta(pageId),
      fetchPageBlocks(pageId),
    ])

    return NextResponse.json({ meta, blocks })
  } catch (error) {
    console.error('Error fetching Notion page:', error)
    return NextResponse.json(
      { error: 'Failed to fetch page content' },
      { status: 500 }
    )
  }
}
