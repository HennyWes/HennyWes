import { NextRequest, NextResponse } from 'next/server'
import { createContact } from '@/lib/db/queries/contacts'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const contact = createContact(body)
    return NextResponse.json(contact, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
