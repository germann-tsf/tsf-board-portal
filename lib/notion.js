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
        const location = getPropertyValue(props.Location)

        meetings.push({
          id: page.id,
          title,
          date,
          committee,
          location,
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

export async function fetchBoardMembers() {
  try {
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

        const alumni = Array.isArray(identifiers) && identifiers.includes('Alumni')

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
