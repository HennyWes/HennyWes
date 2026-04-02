import { NextRequest, NextResponse } from 'next/server'
import { parsePropStreamCsv } from '@/lib/csv/parser'
import { createProperty } from '@/lib/db/queries/properties'
import { createContact } from '@/lib/db/queries/contacts'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const preview = formData.get('preview') === 'true'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const text = await file.text()
    const parsed = parsePropStreamCsv(text)

    if (preview) {
      return NextResponse.json({
        totalRows: parsed.totalRows,
        detectedColumns: parsed.detectedColumns,
        unmatchedHeaders: parsed.unmatchedHeaders,
        sampleRows: parsed.rows.slice(0, 5).map((r) => r.raw),
        validRows: parsed.rows.length,
      })
    }

    const batchId = `csv_${Date.now()}`
    let imported = 0
    let skipped = 0

    for (const row of parsed.rows) {
      try {
        const property = createProperty({
          ...row.property,
          import_batch_id: batchId,
        })

        // If phones came through the CSV (skip traced export), save them too
        if (row.phones.length > 0 || row.email) {
          createContact({
            property_id: property.id,
            full_name: row.property.owner_name,
            relationship: 'Owner',
            email: row.email ?? undefined,
            phones: row.phones.map((phone, i) => ({ phone, rank: i })),
          })
        }

        imported++
      } catch {
        skipped++
      }
    }

    return NextResponse.json({
      ok: true,
      imported,
      skipped,
      batch_id: batchId,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
