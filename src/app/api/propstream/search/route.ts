import { NextRequest, NextResponse } from 'next/server'
import { searchProperties } from '@/lib/propstream/search'
import type { PropertySearchFilters } from '@/types/property'

export async function POST(req: NextRequest) {
  try {
    const body: PropertySearchFilters = await req.json()
    const results = await searchProperties(body)
    return NextResponse.json(results)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
