import { NextRequest, NextResponse } from 'next/server'
import { getProperty, updateProperty, deleteProperty } from '@/lib/db/queries/properties'
import { getContactsForProperty } from '@/lib/db/queries/contacts'
import { getCompsForProperty, analyzeComps } from '@/lib/db/queries/comps'
import { getOutreachForProperty } from '@/lib/db/queries/outreach'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10)
    const property = getProperty(id)
    if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const contacts = getContactsForProperty(id)
    const comps = getCompsForProperty(id)
    const outreach = getOutreachForProperty(id)
    const compsAnalysis = analyzeComps(comps, property.sq_ft)

    return NextResponse.json({ property, contacts, compsAnalysis, outreach })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10)
    const body = await req.json()
    const updated = updateProperty(id, body)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10)
    deleteProperty(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
