import { NextRequest, NextResponse } from 'next/server'
import { listProperties, createProperty, getDashboardStats, getPipelineByStatus } from '@/lib/db/queries/properties'
import type { PropertyStatus } from '@/types/property'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as PropertyStatus | null
    const state = searchParams.get('state') ?? undefined
    const zip = searchParams.get('zip') ?? undefined
    const search = searchParams.get('search') ?? undefined
    const limit = parseInt(searchParams.get('limit') ?? '50', 10)
    const offset = parseInt(searchParams.get('offset') ?? '0', 10)

    if (searchParams.get('stats') === 'true') {
      return NextResponse.json({
        stats: getDashboardStats(),
        pipeline: getPipelineByStatus(),
      })
    }

    const result = listProperties({ status: status ?? undefined, state, zip, search, limit, offset })
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const property = createProperty(body)
    return NextResponse.json(property, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
