/**
 * PropStream API Client
 *
 * PropStream API access is available on qualifying plans. If your plan
 * does not include API access, use the CSV import feature instead.
 *
 * All credentials are stored in the app's database (Settings page),
 * never in environment variables.
 */

import { getSetting, setSetting } from '@/lib/db/queries/settings'

const BASE_URL = 'https://api.propstream.com'

export class PropStreamError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message)
    this.name = 'PropStreamError'
  }
}

async function getToken(): Promise<string> {
  const token = getSetting('propstream_token')
  const expiresStr = getSetting('propstream_token_expires')
  const expires = expiresStr ? parseInt(expiresStr, 10) : 0
  const now = Math.floor(Date.now() / 1000)

  // Re-auth if token missing or expiring within 60s
  if (!token || now >= expires - 60) {
    return await refreshToken()
  }
  return token
}

async function refreshToken(): Promise<string> {
  const email = getSetting('propstream_email')
  const password = getSetting('propstream_password')

  if (!email || !password) {
    throw new PropStreamError('PropStream credentials not configured. Go to Settings to add them.')
  }

  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password }),
  })

  if (!res.ok) {
    throw new PropStreamError(`PropStream login failed: ${res.statusText}`, res.status)
  }

  const data = (await res.json()) as { access_token: string; expires_in?: number }
  const expiresIn = data.expires_in ?? 86400
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn

  setSetting('propstream_token', data.access_token)
  setSetting('propstream_token_expires', String(expiresAt))

  return data.access_token
}

export async function propstreamFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken()

  const makeRequest = async (attempt: number): Promise<T> => {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (res.status === 401) {
      // Token expired mid-session — refresh once and retry
      if (attempt === 0) {
        await refreshToken()
        return makeRequest(1)
      }
      throw new PropStreamError('PropStream authentication failed', 401)
    }

    if (res.status === 429) {
      // Rate limited — back off
      const retryAfter = parseInt(res.headers.get('retry-after') ?? '5', 10)
      await new Promise((r) => setTimeout(r, retryAfter * 1000))
      return makeRequest(attempt)
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new PropStreamError(`PropStream API error ${res.status}: ${body}`, res.status)
    }

    return res.json() as Promise<T>
  }

  return makeRequest(0)
}
