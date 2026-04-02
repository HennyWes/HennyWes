import { NextRequest, NextResponse } from 'next/server'
import { listCampaigns, createCampaign } from '@/lib/db/queries/campaigns'

export async function GET() {
  try {
    return NextResponse.json(listCampaigns())
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const campaign = createCampaign(body)
    return NextResponse.json(campaign, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
