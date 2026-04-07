import { NextResponse } from 'next/server'
import { fetchPageBlocks, fetchPageMeta } from '@/lib/notion'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get('id')

    if (!pageId) {
      return NextResponse.json({ error: 'Missing page ID' }, { status: 400 })
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
