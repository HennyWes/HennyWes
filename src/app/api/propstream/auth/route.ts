import { NextRequest, NextResponse } from 'next/server'
import { getSetting, setSetting } from '@/lib/db/queries/settings'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const res = await fetch('https://api.propstream.com/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return NextResponse.json(
        { error: `PropStream login failed: ${res.status} ${body}` },
        { status: res.status }
      )
    }

    const data = (await res.json()) as { access_token: string; expires_in?: number }
    const expiresIn = data.expires_in ?? 86400
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn

    setSetting('propstream_email', email)
    setSetting('propstream_password', password)
    setSetting('propstream_token', data.access_token)
    setSetting('propstream_token_expires', String(expiresAt))

    return NextResponse.json({
      ok: true,
      expires_at: expiresAt,
      message: 'Connected to PropStream successfully',
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
