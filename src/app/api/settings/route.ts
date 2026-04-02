import { NextRequest, NextResponse } from 'next/server'
import { getSettings, setSettings } from '@/lib/db/queries/settings'
import type { AppSettings } from '@/types/settings'

const READABLE_KEYS: (keyof AppSettings)[] = [
  'propstream_email',
  'investor_name',
  'investor_phone',
  'investor_company',
  'groq_model',
]

export async function GET() {
  try {
    const all = getSettings([
      'propstream_email',
      'propstream_token',
      'propstream_token_expires',
      'investor_name',
      'investor_phone',
      'investor_company',
      'groq_model',
    ])
    return NextResponse.json({
      ...all,
      propstream_password: all.propstream_token ? '••••••••' : '',
      groq_api_key: process.env.GROQ_API_KEY ? '••••••••' : '',
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const updates: Partial<AppSettings> = {}

    if (body.propstream_email) updates.propstream_email = body.propstream_email
    if (body.propstream_password) updates.propstream_password = body.propstream_password
    if (body.investor_name !== undefined) updates.investor_name = body.investor_name
    if (body.investor_phone !== undefined) updates.investor_phone = body.investor_phone
    if (body.investor_company !== undefined) updates.investor_company = body.investor_company
    if (body.groq_model !== undefined) updates.groq_model = body.groq_model

    setSettings(updates)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
