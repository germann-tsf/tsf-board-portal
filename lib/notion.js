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
        if (block.type === 'transcription') {
          b.text = (data.title || []).map(rt => ({
            content: rt.plain_text || '',
            href: rt.href || null,
            bold: rt.annotations?.bold || false,
            italic: rt.annotations?.italic || false,
            underline: rt.annotations?.underline || false,
            code: rt.annotations?.code || false,
          }))
          b.transcriptionStatus = data.status || ''
          b.transcriptionChildren = data.children || {}
          b.recording = data.recording || null
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
        if (block.type === 'transcription' && b.transcriptionChildren) {
          // Transcription blocks have special sub-sections: summary, notes, transcript
          // Fetch summary content which contains the AI-generated meeting notes
          try {
            const summaryId = b.transcriptionChildren.summary_block_id
            const notesId = b.transcriptionChildren.notes_block_id
            const transcriptId = b.transcriptionChildren.transcript_block_id
            const sections = []
            if (summaryId) {
              const summaryBlocks = await fetchPageBlocks(summaryId)
              if (summaryBlocks.length > 0) sections.push(...summaryBlocks)
            }
            if (notesId) {
              const notesBlocks = await fetchPageBlocks(notesId)
              if (notesBlocks.length > 0) sections.push(...notesBlocks)
            }
            b.children = sections
          } catch (e) {
            b.children = []
          }
        } else if (block.has_children) {
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

// Reverse map: member page URL suffix → committee names
// Built from Committees & Programs DB which isn't shared with the API integration.
// The relation property on board members returns [] when target DB is inaccessible.
const MEMBER_COMMITTEES = {
  '22984a2d469080209cd0e9bf41d97af0': ['Executive', 'Finance', 'Fundraising', 'Governance', 'SHCP'],
  '22a84a2d469080359fe7fd74bb1a8f3b': ['SHCP'],
  '22a84a2d46908069be9df3a3d6bac28b': ['Executive', 'Governance', 'SHCP'],
  '22a84a2d469080a696f1db1f1d4063b7': ['Fundraising'],
  '22a84a2d469080ddbe03ca2a75f527d8': ['Finance', 'Governance'],
  '22a84a2d469080eda7e2f0fb87b0dbdf': ['Governance'],
  '22b84a2d4690800b83aefb57e6cfa1b3': ['SHCP'],
  '22b84a2d4690800f8d53fb0278a3a4d2': ['Finance', 'Fundraising', 'SHCP'],
  '22b84a2d46908020a640d9aaba3a1382': ['Executive', 'Finance'],
  '22b84a2d4690802ab455cfdc92f13e10': ['SHCP'],
  '22b84a2d46908035811fff0c2686942e': ['Governance'],
  '22b84a2d4690805eb10cf084c78a9ff0': ['SHCP'],
  '22b84a2d469080639a0ccff6f1ad8892': ['SHCP'],
  '22b84a2d46908067aa9fc5eca3f7696f': ['Executive', 'Finance', 'Fundraising', 'Governance', 'SHCP'],
  '22b84a2d4690807da70acd42a563f210': ['Executive', 'Fundraising'],
  '22b84a2d469080899badea1d0ea152c7': ['Executive'],
  '22b84a2d469080958fe0f5436c755a23': ['Finance', 'Fundraising'],
  '22b84a2d46908097bb0bd1b50816f70d': ['Fundraising'],
  '22b84a2d469080988ed5eba779acc00f': ['Fundraising', 'Governance'],
  '22b84a2d469080a9bf12edf8a7c024ff': ['Finance', 'SHCP'],
  '22b84a2d469080aba1eff744079d935f': ['Executive', 'Finance', 'Fundraising', 'Governance', 'SHCP'],
  '22b84a2d469080acb3dae57fcba98f40': ['SHCP'],
  '22b84a2d469080b789b5ea47b1b07b7c': ['Fundraising'],
  '22b84a2d469080bc9125ce0546c26be7': ['SHCP'],
  '22b84a2d469080f19c3cf81790e240df': ['Fundraising'],
  '22b84a2d469080fb923ffd1739304209': ['SHCP'],
  '22b84a2d469080ffb0c2e334df731e7e': ['SHCP'],
  '22c84a2d469080dabaf6df4d6c0d9c9f': ['Governance'],
}

// Convert Notion page URL to the short ID format used in MEMBER_COMMITTEES
function pageIdToShort(id) {
  return id.replace(/-/g, '')
}

function getMemberCommittees(memberId) {
  const shortId = pageIdToShort(memberId)
  return MEMBER_COMMITTEES[shortId] || []
}

// Fetch committee map (kept for future use if DB access is restored)
async function fetchCommitteeMap() {
  const map = {}
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

        // Use hardcoded reverse map since Committees DB isn't shared with integration
        let committees = getMemberCommittees(page.id)
        // Fallback to relation-based lookup if reverse map is empty but relation has data
        if (committees.length === 0 && committeeIds.length > 0) {
          committees = committeeIds.map(id => committeeMap[id]).filter(Boolean)
        }

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
