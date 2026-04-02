import { NextRequest, NextResponse } from 'next/server'
import { updateOutreachStatus } from '@/lib/db/queries/outreach'
import type { OutreachStatus } from '@/types/outreach'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10)
    const { status, notes }: { status: OutreachStatus; notes?: string } = await req.json()
    updateOutreachStatus(id, status, notes)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
