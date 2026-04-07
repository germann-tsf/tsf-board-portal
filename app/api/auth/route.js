import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { password } = body

    // Check password against environment variable
    if (password === process.env.PORTAL_PASSWORD) {
      // Create response with auth cookie
      const response = NextResponse.json({ success: true })
      response.cookies.set('tsf-portal-auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      })
      return response
    } else {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('tsf-portal-auth', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
