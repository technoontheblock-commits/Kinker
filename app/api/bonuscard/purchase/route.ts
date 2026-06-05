import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.redirect(new URL('/api/membership/purchase', process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kinker.ch'), 307)
}
