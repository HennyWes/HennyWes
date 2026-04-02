import { NextRequest, NextResponse } from 'next/server'
import { toggleDNC } from '@/lib/db/queries/contacts'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const phoneId = parseInt(params.id, 10)
    const { dnc }: { dnc: boolean } = await req.json()
    toggleDNC(phoneId, dnc)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
