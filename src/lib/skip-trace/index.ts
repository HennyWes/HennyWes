/**
 * Free Skip Tracing
 *
 * Uses TruePeopleSearch.com and lookup.io to find owner contact info.
 * These are free public records search tools.
 *
 * The search is done server-side so the user just clicks "Skip Trace"
 * and gets results back. For best results, run skip trace after importing
 * your PropStream CSV (which includes owner name and mailing address).
 */

export interface SkipTraceResult {
  full_name: string
  phones: Array<{
    number: string
    type: 'mobile' | 'landline' | 'voip' | null
    formatted: string
  }>
  emails: string[]
  age: number | null
  relatives: string[]
  source: string
}

export type { OwnerLookupInput as SkipTraceInput } from './urls'
export { buildTruePeopleSearchUrl, buildLookupIoUrl } from './urls'

import { buildTruePeopleSearchUrl, buildLookupIoUrl } from './urls'
import type { OwnerLookupInput } from './urls'

// ─── TruePeopleSearch ─────────────────────────────────────────────────────────

async function scrapeTPSResults(input: OwnerLookupInput): Promise<SkipTraceResult[]> {
  const url = buildTruePeopleSearchUrl(input)

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  })

  if (!res.ok) return []

  const html = await res.text()
  return parseTPSHtml(html, input.owner_name)
}

function parseTPSHtml(html: string, ownerName: string): SkipTraceResult[] {
  const results: SkipTraceResult[] = []

  // Extract name blocks — each result card contains data-detail-link
  const cardPattern = /data-detail-link[^>]*>([\s\S]*?)(?=data-detail-link|<\/div>\s*<\/div>\s*<\/div>|$)/gi
  const namePattern = /<span[^>]*class="[^"]*h4[^"]*"[^>]*>([\s\S]*?)<\/span>/i
  const phonePattern = /(?:^|\D)(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})(?:\D|$)/g
  const emailPattern = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
  const agePattern = /Age[^0-9]*(\d{2,3})/i

  // Simplified: extract all phone numbers from the page that look valid
  const allPhones: string[] = []
  let phoneMatch
  while ((phoneMatch = phonePattern.exec(html)) !== null) {
    const cleaned = phoneMatch[1].replace(/\D/g, '')
    if (cleaned.length === 10 && !allPhones.includes(cleaned)) {
      allPhones.push(cleaned)
    }
  }

  const allEmails: string[] = []
  let emailMatch
  while ((emailMatch = emailPattern.exec(html)) !== null) {
    if (!allEmails.includes(emailMatch[0])) {
      allEmails.push(emailMatch[0])
    }
  }

  const ageMatch = agePattern.exec(html)
  const age = ageMatch ? parseInt(ageMatch[1], 10) : null

  if (allPhones.length > 0 || allEmails.length > 0) {
    results.push({
      full_name: ownerName,
      phones: allPhones.slice(0, 5).map((num) => ({
        number: num,
        type: null,
        formatted: formatPhone(num),
      })),
      emails: allEmails.slice(0, 3),
      age,
      relatives: [],
      source: 'truepeoplesearch',
    })
  }

  return results
}

// ─── lookup.io ───────────────────────────────────────────────────────────────

async function scrapeLookupIo(input: OwnerLookupInput): Promise<SkipTraceResult[]> {
  const url = buildLookupIoUrl(input)

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html',
      },
    })

    if (!res.ok) return []

    const html = await res.text()
    return parseLookupIoHtml(html, input.owner_name)
  } catch {
    return []
  }
}

function parseLookupIoHtml(html: string, ownerName: string): SkipTraceResult[] {
  const phonePattern = /(?:^|\D)(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})(?:\D|$)/g
  const emailPattern = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g

  const allPhones: string[] = []
  let phoneMatch
  while ((phoneMatch = phonePattern.exec(html)) !== null) {
    const cleaned = phoneMatch[1].replace(/\D/g, '')
    if (cleaned.length === 10 && !allPhones.includes(cleaned)) {
      allPhones.push(cleaned)
    }
  }

  const allEmails: string[] = []
  let emailMatch
  while ((emailMatch = emailPattern.exec(html)) !== null) {
    if (!allEmails.includes(emailMatch[0])) {
      allEmails.push(emailMatch[0])
    }
  }

  if (allPhones.length === 0 && allEmails.length === 0) return []

  return [{
    full_name: ownerName,
    phones: allPhones.slice(0, 5).map((num) => ({
      number: num,
      type: null,
      formatted: formatPhone(num),
    })),
    emails: allEmails.slice(0, 3),
    age: null,
    relatives: [],
    source: 'lookup.io',
  }]
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function skipTrace(input: OwnerLookupInput): Promise<{
  results: SkipTraceResult[]
  searchUrls: { truePeopleSearch: string; lookupIo: string }
}> {
  const searchUrls = {
    truePeopleSearch: buildTruePeopleSearchUrl(input),
    lookupIo: buildLookupIoUrl(input),
  }

  if (!input.owner_name?.trim()) {
    return { results: [], searchUrls }
  }

  // Run both sources in parallel
  const [tpsResults, lookupResults] = await Promise.allSettled([
    scrapeTPSResults(input),
    scrapeLookupIo(input),
  ])

  const allResults: SkipTraceResult[] = []

  if (tpsResults.status === 'fulfilled') {
    allResults.push(...tpsResults.value)
  }
  if (lookupResults.status === 'fulfilled') {
    allResults.push(...lookupResults.value)
  }

  // Deduplicate phones across sources
  const seenPhones = new Set<string>()
  const merged: SkipTraceResult[] = []

  for (const result of allResults) {
    const uniquePhones = result.phones.filter((p) => {
      if (seenPhones.has(p.number)) return false
      seenPhones.add(p.number)
      return true
    })
    if (uniquePhones.length > 0 || result.emails.length > 0) {
      merged.push({ ...result, phones: uniquePhones })
    }
  }

  return { results: merged, searchUrls }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, '')
  if (d.length === 10) {
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  }
  return digits
}
