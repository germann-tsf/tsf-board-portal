import { NextResponse } from 'next/server'

// Debug endpoint removed — was exposing database IDs and API errors publicly
export async function GET() {
  return NextResponse.json({ error: 'Endpoint removed' }, { status: 404 })
}
