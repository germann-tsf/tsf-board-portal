import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    // Revalidate the data API route and the portal page
    revalidatePath('/api/data', 'page')
    revalidatePath('/portal', 'page')
    revalidatePath('/', 'page')

    return NextResponse.json({ revalidated: true, now: Date.now() })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
