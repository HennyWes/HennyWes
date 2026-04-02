import { NextRequest, NextResponse } from 'next/server'
import { getRecentActivity } from '@/lib/db/queries/outreach'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') ?? '10', 10)
    const activity = getRecentActivity(limit)
    return NextResponse.json(activity)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
