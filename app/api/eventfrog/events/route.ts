import { NextRequest, NextResponse } from 'next/server'
import { getEventfrogEvents } from '@/lib/eventfrog'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const events = await getEventfrogEvents()
    return NextResponse.json({ events, count: events.length })
  } catch (error: any) {
    console.error('Error fetching Eventfrog events:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
