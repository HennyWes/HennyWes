import Papa from 'papaparse'
import { mapHeader } from './columnMaps'
import type { CreatePropertyInput } from '@/types/property'

export interface ParsedRow {
  property: CreatePropertyInput
  phones: string[]
  email: string | null
  raw: Record<string, string>
}

export interface ParseResult {
  rows: ParsedRow[]
  detectedColumns: Record<string, string>
  unmatchedHeaders: string[]
  totalRows: number
}

function parseBool(val: string | undefined): boolean | undefined {
  if (!val) return undefined
  const v = val.toLowerCase().trim()
  return v === 'yes' || v === 'true' || v === '1' || v === 'y'
}

function parseNum(val: string | undefined): number | undefined {
  if (!val) return undefined
  const n = parseFloat(val.replace(/[$,]/g, ''))
  return isNaN(n) ? undefined : n
}

function parseDate(val: string | undefined): string | undefined {
  if (!val) return undefined
  const d = new Date(val)
  if (isNaN(d.getTime())) return undefined
  return d.toISOString().split('T')[0]
}

export function parsePropStreamCsv(csvText: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })

  const headers = parsed.meta.fields ?? []
  const detectedColumns: Record<string, string> = {}
  const unmatchedHeaders: string[] = []

  for (const h of headers) {
    const mapped = mapHeader(h)
    if (mapped) {
      detectedColumns[h] = mapped
    } else {
      unmatchedHeaders.push(h)
    }
  }

  const rows: ParsedRow[] = []

  for (const raw of parsed.data) {
    // Build a canonical object from mapped columns
    const canonical: Record<string, string> = {}
    for (const [originalHeader, value] of Object.entries(raw)) {
      const mapped = mapHeader(originalHeader)
      if (mapped) {
        canonical[mapped] = value
      }
    }

    if (!canonical.address || !canonical.city || !canonical.state) continue

    const phones: string[] = []
    for (const key of ['phone_1', 'phone_2', 'phone_3']) {
      const val = canonical[key]?.replace(/\D/g, '')
      if (val && val.length >= 10) phones.push(val.slice(-10))
    }

    rows.push({
      property: {
        address: canonical.address,
        city: canonical.city,
        state: canonical.state,
        zip: canonical.zip ?? '',
        county: canonical.county || undefined,
        parcel_number: canonical.parcel_number || undefined,
        property_type: canonical.property_type || undefined,
        bedrooms: parseNum(canonical.bedrooms),
        bathrooms: parseNum(canonical.bathrooms),
        sq_ft: parseNum(canonical.sq_ft),
        lot_size_sqft: parseNum(canonical.lot_size_sqft),
        year_built: parseNum(canonical.year_built),
        estimated_value: parseNum(canonical.estimated_value),
        assessed_value: parseNum(canonical.assessed_value),
        last_sale_price: parseNum(canonical.last_sale_price),
        last_sale_date: parseDate(canonical.last_sale_date),
        estimated_equity: parseNum(canonical.estimated_equity),
        equity_percent: parseNum(canonical.equity_percent),
        mortgage_balance: parseNum(canonical.mortgage_balance),
        pre_foreclosure: parseBool(canonical.pre_foreclosure),
        foreclosure: parseBool(canonical.foreclosure),
        reo: parseBool(canonical.reo),
        bankruptcy: parseBool(canonical.bankruptcy),
        tax_delinquent: parseBool(canonical.tax_delinquent),
        vacant: parseBool(canonical.vacant),
        absentee_owner: parseBool(canonical.absentee_owner),
        owner_name: canonical.owner_name || undefined,
        owner_mailing_address: canonical.owner_mailing_address || undefined,
        owner_mailing_city: canonical.owner_mailing_city || undefined,
        owner_mailing_state: canonical.owner_mailing_state || undefined,
        owner_mailing_zip: canonical.owner_mailing_zip || undefined,
        source: 'csv_import',
      },
      phones,
      email: canonical.email || null,
      raw,
    })
  }

  return {
    rows,
    detectedColumns,
    unmatchedHeaders,
    totalRows: parsed.data.length,
  }
}
