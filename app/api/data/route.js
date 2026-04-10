import { NextResponse } from 'next/server'
import { fetchMeetings, fetchBoardMembers, fetchActionPlan } from '@/lib/notion'

export const revalidate = 60 // ISR: revalidate every 60 seconds

export async function GET(request) {
  try {
    // Fetch independently so one failure doesn't block the other
    const [meetingsResult, membersResult, actionPlanResult] = await Promise.allSettled([
      fetchMeetings(),
      fetchBoardMembers(),
      fetchActionPlan(),
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

    if (errors.length === 2) {
      return NextResponse.json(
        { error: 'Failed to fetch data', details: errors.join(' | ') },
        { status: 500 }
      )
    }

    return NextResponse.json({
      meetings: meetingsResult.status === 'fulfilled' ? meetingsResult.value : [],
      boardMembers: membersResult.status === 'fulfilled' ? membersResult.value : [],
      actionPlan: actionPlanResult.status === 'fulfilled' ? actionPlanResult.value : [],
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
