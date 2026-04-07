import { Client } from '@notionhq/client'

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

// Helper to extract rich text content
function getRichTextValue(richTextArray) {
  if (!richTextArray || !Array.isArray(richTextArray)) return ''
  return richTextArray.map(text => text.plain_text || '').join('')
}

// Helper to extract property values based on type
function getPropertyValue(property) {
  if (!property) return null

  switch (property.type) {
    case 'title':
      return getRichTextValue(property.title)
    case 'rich_text':
      return getRichTextValue(property.rich_text)
    case 'select':
      return property.select?.name || null
    case 'multi_select':
      return property.multi_select?.map(item => item.name) || []
    case 'date':
      return property.date?.start || null
    case 'email':
      return property.email || null
    case 'phone_number':
      return property.phone_number || null
    case 'checkbox':
      return property.checkbox || false
    case 'status':
      return property.status?.name || null
    case 'relation':
      return property.relation?.map(rel => rel.id) || []
    default:
      return null
  }
}

export async function fetchMeetings() {
  try {
    const meetings = []
    let hasMore = true
    let cursor = undefined

    while (hasMore) {
      const response = await notion.databases.query({
        database_id: process.env.NOTION_MEETINGS_DB,
        sorts: [
          {
            property: 'Date',
            direction: 'descending',
          },
        ],
        start_cursor: cursor,
      })

      for (const page of response.results) {
        const props = page.properties
        const title = getPropertyValue(props.Title)
        const date = getPropertyValue(props.Date)
        const committee = getPropertyValue(props.Committee)
        const published = getPropertyValue(props.Published)

        meetings.push({
          id: page.id,
          title,
          date,
          committee,
          published: published === true,
          notionUrl: page.url,
        })
      }

      hasMore = response.has_more
      cursor = response.next_cursor
    }

    return meetings
  } catch (error) {
    console.error('Error fetching meetings:', error)
    throw error
  }
}

// Fetch all blocks (content) from a Notion page
export async function fetchPageBlocks(pageId) {
  try {
    const blocks = []
    let hasMore = true
    let cursor = undefined

    while (hasMore) {
      const response = await notion.blocks.children.list({
        block_id: pageId,
        start_cursor: cursor,
        page_size: 100,
      })

      for (const block of response.results) {
        const b = {
          id: block.id,
          type: block.type,
          has_children: block.has_children,
        }

        const data = block[block.type]
        if (!data) {
          blocks.push(b)
          continue
        }

        // Extract text content from rich_text arrays
        if (data.rich_text) {
          b.text = data.rich_text.map(rt => ({
            content: rt.plain_text || '',
            href: rt.href || null,
            bold: rt.annotations?.bold || false,
            italic: rt.annotations?.italic || false,
            underline: rt.annotations?.underline || false,
            code: rt.annotations?.code || false,
          }))
        }

        // Handle specific block types
        if (block.type === 'to_do') {
          b.checked = data.checked || false
        }
        if (block.type === 'callout') {
          b.icon = data.icon?.emoji || '💡'
        }
        if (block.type === 'file' || block.type === 'pdf') {
          const fileData = data.type === 'file' ? data.file : data.external
          b.fileUrl = fileData?.url || null
          b.fileName = data.name || data.caption?.[0]?.plain_text || 'Download'
        }
        if (block.type === 'image') {
          const imgData = data.type === 'file' ? data.file : data.external
          b.imageUrl = imgData?.url || null
          b.caption = data.caption?.map(c => c.plain_text).join('') || ''
        }
        if (block.type === 'bookmark' || block.type === 'embed') {
          b.url = data.url || null
          b.caption = data.caption?.map(c => c.plain_text).join('') || ''
        }
        if (block.type === 'divider') {
          // no extra data needed
        }
        if (block.type === 'toggle') {
          // text already handled above; children fetched separately if needed
        }
        if (block.type === 'child_page') {
          b.childTitle = data.title || ''
        }
        if (block.type === 'child_database') {
          b.childTitle = data.title || ''
        }
        if (block.type === 'table') {
          b.tableWidth = data.table_width || 0
          b.hasColumnHeader = data.has_column_header || false
          b.hasRowHeader = data.has_row_header || false
        }
        if (block.type === 'table_row') {
          b.cells = (data.cells || []).map(cell =>
            cell.map(c => c.plain_text || '').join('')
          )
        }

        // Fetch children for blocks that have them (toggle, table, etc.)
        if (block.has_children) {
          try {
            const childBlocks = await fetchPageBlocks(block.id)
            b.children = childBlocks
          } catch (e) {
            b.children = []
          }
        }

        blocks.push(b)
      }

      hasMore = response.has_more
      cursor = response.next_cursor
    }

    return blocks
  } catch (error) {
    console.error('Error fetching page blocks:', error)
    throw error
  }
}

// Fetch page metadata (title, etc.)
export async function fetchPageMeta(pageId) {
  try {
    const page = await notion.pages.retrieve({ page_id: pageId })
    const props = page.properties
    let title = ''
    // Try common title property names
    for (const key of Object.keys(props)) {
      if (props[key].type === 'title') {
        title = getRichTextValue(props[key].title)
        break
      }
    }
    return { id: page.id, title, url: page.url }
  } catch (error) {
    console.error('Error fetching page meta:', error)
    throw error
  }
}

// Fetch all committees/programs and return a map of pageId → name
async function fetchCommitteeMap() {
  const map = {}
  try {
    let hasMore = true
    let cursor = undefined
    // Committees & Programs database page ID
    const committeesDbId = '22984a2d-4690-802e-a8c7-f36bf3c93186'

    while (hasMore) {
      const response = await notion.databases.query({
        database_id: committeesDbId,
        start_cursor: cursor,
      })
      for (const page of response.results) {
        const name = getPropertyValue(page.properties.Name)
        if (name) map[page.id] = name
      }
      hasMore = response.has_more
      cursor = response.next_cursor
    }
  } catch (error) {
    console.error('Error fetching committee map (non-fatal):', error.message)
  }
  return map
}

export async function fetchBoardMembers() {
  try {
    // Fetch committee lookup map first
    const committeeMap = await fetchCommitteeMap()

    const members = []
    let hasMore = true
    let cursor = undefined

    while (hasMore) {
      const response = await notion.databases.query({
        database_id: process.env.NOTION_MEMBERS_DB,
        filter: {
          property: 'Status',
          status: {
            equals: 'Current Board Member',
          },
        },
        start_cursor: cursor,
      })

      for (const page of response.results) {
        const props = page.properties

        const name = getPropertyValue(props['Board Member'])
        const first = getPropertyValue(props.First)
        const last = getPropertyValue(props.Last)
        const position = getPropertyValue(props['TSF Position'])
        const email = getPropertyValue(props['Email Address'])
        const cell = getPropertyValue(props['Cell Phone'])
        const employer = getPropertyValue(props['Employed By'])
        const title = getPropertyValue(props['Job Title'])
        const city = getPropertyValue(props.City)
        const state = getPropertyValue(props.State)
        const termStart = getPropertyValue(props['Term Start'])
        const termEnd = getPropertyValue(props['Term End'])
        const termCount = getPropertyValue(props['Term Count'])
        const pronouns = getPropertyValue(props.Pronouns)
        const alumniYear = getPropertyValue(props['Alumni Year'])
        const identifiers = getPropertyValue(props.Identifiers)
        const committeeIds = getPropertyValue(props.Committees) || []

        const alumni = Array.isArray(identifiers) && identifiers.includes('Alumni')

        // Resolve committee relation IDs to names
        const committees = committeeIds
          .map(id => committeeMap[id])
          .filter(Boolean)

        members.push({
          id: page.id,
          name,
          first,
          last,
          position: Array.isArray(position) ? position : position ? [position] : [],
          email,
          cell,
          employer,
          title,
          city,
          state,
          termStart,
          termEnd,
          termCount,
          pronouns,
          alumni,
          alumniYear,
          committees,
          notionUrl: page.url,
        })
      }

      hasMore = response.has_more
      cursor = response.next_cursor
    }

    return members
  } catch (error) {
    console.error('Error fetching board members:', error)
    throw error
  }
}
