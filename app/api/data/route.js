import { NextResponse } from 'next/server'
import { fetchMeetings, fetchBoardMembers, fetchPastMembers, fetchActionPlan, fetchFoundationalDocs } from '@/lib/notion'

export const revalidate = 300 // ISR: revalidate every 5 minutes

export async function GET(request) {
  try {
    // Fetch independently so one failure doesn't block the other
    const [meetingsResult, membersResult, pastMembersResult, actionPlanResult, docsResult] = await Promise.allSettled([
      fetchMeetings(),
      fetchBoardMembers(),
      fetchPastMembers(),
      fetchActionPlan(),
      fetchFoundationalDocs(),
    ])

    const errors = []
    if (meetingsResult.status === 'rejected') {
      console.error('Meetings DB error:', meetingsResult.reason)
      errors.push(`Meetings: ${meetingsResult.reason.message}`)
    }
    if (membersResult.status === 'rejected') {
      console.error('Members DB error:', membersResult.reason)
      errors.push(`Members: ${membersResult.reason.message}`)
    }
    if (pastMembersResult.status === 'rejected') {
      console.error('Past Members DB error:', pastMembersResult.reason)
      errors.push(`PastMembers: ${pastMembersResult.reason.message}`)
    }
    if (actionPlanResult.status === 'rejected') {
      console.error('Action Plan DB error:', actionPlanResult.reason)
      errors.push(`ActionPlan: ${actionPlanResult.reason.message}`)
    }
    if (docsResult.status === 'rejected') {
      console.error('Docs error:', docsResult.reason)
      errors.push(`Docs: ${docsResult.reason.message}`)
    }

    if (meetingsResult.status === 'rejected' && membersResult.status === 'rejected') {
      return NextResponse.json(
        { error: 'Failed to fetch data', details: errors.join(' | ') },
        { status: 500 }
      )
    }

    const boardMembers = membersResult.status === 'fulfilled' ? membersResult.value : []

    return NextResponse.json({
      meetings: meetingsResult.status === 'fulfilled' ? meetingsResult.value : [],
      boardMembers,
      boardMemberCount: boardMembers.length,
      pastMembers: pastMembersResult.status === 'fulfilled' ? pastMembersResult.value : [],
      actionPlan: actionPlanResult.status === 'fulfilled' ? actionPlanResult.value : [],
      foundationalDocs: docsResult.status === 'fulfilled' ? docsResult.value : [],
      warnings: errors.length ? errors : undefined,
    })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: error.message },
      { status: 500 }
    )
  }
}
