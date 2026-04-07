import { NextResponse } from 'next/server'
import { fetchMeetings, fetchBoardMembers } from '@/lib/notion'

export const revalidate = 60 // ISR: revalidate every 60 seconds

export async function GET(request) {
  try {
    const [meetings, boardMembers] = await Promise.all([
      fetchMeetings(),
      fetchBoardMembers(),
    ])

    return NextResponse.json({
      meetings,
      boardMembers,
    })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
