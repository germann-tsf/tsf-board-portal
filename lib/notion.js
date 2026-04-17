import { Client } from '@notionhq/client'

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

// Helper to extract rich text content
function getRichTextValue(richTextArray) {
  if (!richTextArray || !Array.isArray(richTextArray)) return ''
  return richTextArray.map(text => text.plain_text || '').join('')
}

// Schema validation: warn when expected Notion properties are missing
function validateProps(props, expectedKeys, context) {
  const missing = expectedKeys.filter(k => !(k in props))
  if (missing.length > 0) {
    console.warn(`[Schema Drift] ${context}: missing properties: ${missing.join(', ')}`)
  }
  return missing
}

const MEETING_PROPS = ['Title', 'Date', 'Committee', 'Published']
const MEMBER_PROPS = ['Board Member', 'First', 'Last', 'Membership Type', 'Officer Role',
  'Email Address', 'Cell Phone', 'Employed By', 'Job Title', 'City', 'State',
  'Term Start', 'Term End', 'Term Count', 'Pronouns', 'Alumni Year', 'Identifiers',
  'Committees', 'Committee Roles', 'Status']
const ACTION_PLAN_PROPS = ['Action Item', 'Goal', 'Status', 'Committee', 'Owner', 'Objective', 'Target Date', 'Progress Notes']

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
        // Only return meetings explicitly marked as Published. Drafts stay server-side
        // and never reach the client, so they cannot appear in lists or be loaded via
        // a direct /meeting/<id> URL.
        filter: {
          property: 'Published',
          checkbox: { equals: true },
        },
        sorts: [
          {
            property: 'Date',
            direction: 'descending',
          },
        ],
        start_cursor: cursor,
      })

      for (const page of response.results) {
        const props = page.properties || {}
        if (page === response.results[0]) validateProps(props, MEETING_PROPS, 'Meetings')
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
const MAX_BLOCK_DEPTH = 5
export async function fetchPageBlocks(pageId, depth = 0) {
  if (depth > MAX_BLOCK_DEPTH) {
    console.warn(`[Notion] Max block depth (${MAX_BLOCK_DEPTH}) reached for page ${pageId}, skipping children`)
    return []
  }
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
          try {
            const summaryId = b.transcriptionChildren.summary_block_id
            const notesId = b.transcriptionChildren.notes_block_id
            const sections = []
            if (summaryId) {
              const summaryBlocks = await fetchPageBlocks(summaryId, depth + 1)
              if (summaryBlocks.length > 0) sections.push(...summaryBlocks)
            }
            if (notesId) {
              const notesBlocks = await fetchPageBlocks(notesId, depth + 1)
              if (notesBlocks.length > 0) sections.push(...notesBlocks)
            }
            b.children = sections
          } catch (e) {
            b.children = []
          }
        } else if (block.has_children) {
          try {
            const childBlocks = await fetchPageBlocks(block.id, depth + 1)
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

// Direct Notion API call for data sources (supports multi-source databases).
// The old SDK (API 2022-06-28) rejects multi-source databases, so we use
// the 2025-09-03 endpoint for board members specifically.
async function queryDataSource(dataSourceId, { filter, sorts, startCursor } = {}) {
  const body = {}
  if (filter) body.filter = filter
  if (sorts) body.sorts = sorts
  if (startCursor) body.start_cursor = startCursor

  const res = await fetch(
    `https://api.notion.com/v1/data_sources/${dataSourceId}/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2025-09-03',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Notion API error ${res.status}`)
  }

  return res.json()
}

export async function fetchBoardMembers() {
  try {
    const members = []
    let hasMore = true
    let cursor = undefined

    while (hasMore) {
      const response = await queryDataSource(process.env.NOTION_MEMBERS_DB, {
        filter: {
          property: 'Status',
          status: {
            equals: 'Current Board Member',
          },
        },
        startCursor: cursor,
      })

      for (const page of response.results) {
        const props = page.properties || {}
        if (page === response.results[0]) validateProps(props, MEMBER_PROPS, 'Board Members')

        const name = getPropertyValue(props['Board Member'])
        const first = getPropertyValue(props.First)
        const last = getPropertyValue(props.Last)
        const membershipType = getPropertyValue(props['Membership Type'])
        const officerRole = getPropertyValue(props['Officer Role'])
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
        // Read committees from multi-select property (migrated from relation)
        const committees = getPropertyValue(props['Committees']) || []
        // Read committee chair/leadership roles
        const committeeRoles = getPropertyValue(props['Committee Roles']) || []

        const alumni = Array.isArray(identifiers) && identifiers.includes('Alumni')

        // Build display-friendly position array from new schema
        const position = []
        if (officerRole && officerRole !== 'None') position.push(officerRole)
        if (membershipType === 'Voting') {
          if (position.length === 0) position.push('Board Member')
        } else if (membershipType === 'Ex officio (Non Voting)') {
          position.push('Ex Officio')
        } else if (membershipType === 'Staff (Non Voting)') {
          position.push('Staff')
        } else if (membershipType === 'Committee Only (Non Voting)') {
          position.push('Committee Member')
        } else if (membershipType === 'Emeritus') {
          position.push('Emeritus')
        } else if (membershipType) {
          position.push(membershipType)
        }

        members.push({
          id: page.id,
          name,
          first,
          last,
          position,
          membershipType,
          officerRole,
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
          committeeRoles,
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

export async function fetchPastMembers() {
  try {
    const members = []
    let hasMore = true
    let cursor = undefined

    while (hasMore) {
      const response = await queryDataSource(process.env.NOTION_MEMBERS_DB, {
        filter: {
          or: [
            {
              property: 'Resigned',
              date: { is_not_empty: true },
            },
            {
              property: 'Status',
              status: { equals: 'Past Board Member' },
            },
          ],
        },
        sorts: [{ property: 'Resigned', direction: 'descending' }],
        startCursor: cursor,
      })

      for (const page of response.results) {
        const props = page.properties || {}
        members.push({
          id: page.id,
          name: getPropertyValue(props['Board Member']),
          first: getPropertyValue(props.First),
          last: getPropertyValue(props.Last),
          membershipType: getPropertyValue(props['Membership Type']),
          officerRole: getPropertyValue(props['Officer Role']),
          email: getPropertyValue(props['Email Address']),
          cell: getPropertyValue(props['Cell Phone']),
          employer: getPropertyValue(props['Employed By']),
          title: getPropertyValue(props['Job Title']),
          resigned: getPropertyValue(props.Resigned),
          termStart: getPropertyValue(props['Term Start']),
          termEnd: getPropertyValue(props['Term End']),
          committees: getPropertyValue(props['Committees']) || [],
        })
      }

      hasMore = response.has_more
      cursor = response.next_cursor
    }

    return members
  } catch (error) {
    console.error('Error fetching past members:', error)
    throw error
  }
}

// ─── Foundational Documents ──────────────────────────────────────────
const FOUNDATIONAL_DOCS_PAGE_ID = '33b84a2d4690816493d2e0f50f25c440'

export async function fetchFoundationalDocs() {
  try {
    const blocks = await fetchPageBlocks(FOUNDATIONAL_DOCS_PAGE_ID)
    const categories = []
    let currentCategory = null

    for (const block of blocks) {
      // H2 headings = categories (Governance & Legal, Strategy & Planning, etc.)
      if (block.type === 'heading_2') {
        const text = block.text?.map(t => t.content).join('') || ''
        if (text) {
          currentCategory = { name: text, items: [] }
          categories.push(currentCategory)
        }
        continue
      }

      if (!currentCategory) continue

      // Toggle blocks = document groups (contain files inside)
      if (block.type === 'toggle') {
        const toggleName = block.text?.map(t => t.content).join('') || ''
        if (block.children && block.children.length > 0) {
          for (const child of block.children) {
            if (child.type === 'file' || child.type === 'pdf') {
              currentCategory.items.push({
                name: child.fileName || toggleName,
                fileUrl: child.fileUrl,
                type: 'file',
              })
            } else if (child.type === 'child_page') {
              currentCategory.items.push({
                name: child.childTitle || 'Untitled',
                pageId: child.id,
                type: 'page',
              })
            } else if (child.type === 'toggle' && child.children) {
              // Nested toggle (e.g., individual years under 990s)
              for (const nested of child.children) {
                if (nested.type === 'file' || nested.type === 'pdf') {
                  const prefix = child.text?.map(t => t.content).join('') || ''
                  currentCategory.items.push({
                    name: nested.fileName || prefix,
                    fileUrl: nested.fileUrl,
                    type: 'file',
                  })
                }
              }
            }
          }
        }
        // If toggle had no file children, add it as a label
        if (currentCategory.items.length === 0 || currentCategory.items[currentCategory.items.length - 1]?.name !== toggleName) {
          // Only add toggle as a group header if it had children we already added
        }
        continue
      }

      // Direct file blocks under a category
      if (block.type === 'file' || block.type === 'pdf') {
        currentCategory.items.push({
          name: block.fileName || 'Download',
          fileUrl: block.fileUrl,
          type: 'file',
        })
      }

      // Child pages directly under a category
      if (block.type === 'child_page') {
        currentCategory.items.push({
          name: block.childTitle || 'Untitled',
          pageId: block.id,
          type: 'page',
        })
      }
    }

    return categories
  } catch (error) {
    console.error('Error fetching foundational docs:', error)
    return []
  }
}

// ─── Strategic Action Plan ────────────────────────────────────────────
const ACTION_PLAN_DB = '8d54ffc8-0f0f-4836-ab95-4759746fb772'

export async function fetchActionPlan() {
  try {
    let items = []
    let hasMore = true
    let cursor = undefined

    while (hasMore) {
      const response = await notion.databases.query({
        database_id: ACTION_PLAN_DB,
        start_cursor: cursor,
        page_size: 100,
      })

      for (const page of response.results) {
        const props = page.properties || {}
        if (page === response.results[0]) validateProps(props, ACTION_PLAN_PROPS, 'Action Plan')
        items.push({
          id: page.id,
          actionItem: getPropertyValue(props['Action Item']),
          goal: getPropertyValue(props['Goal']),
          status: getPropertyValue(props['Status']),
          committee: getPropertyValue(props['Committee']),
          owner: getPropertyValue(props['Owner']),
          objective: getPropertyValue(props['Objective']),
          targetDate: getPropertyValue(props['Target Date']),
          progressNotes: getPropertyValue(props['Progress Notes']),
        })
      }

      hasMore = response.has_more
      cursor = response.next_cursor
    }

    return items
  } catch (error) {
    console.error('Error fetching action plan:', error)
    throw error
  }
}
