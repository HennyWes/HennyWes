import { NextRequest, NextResponse } from 'next/server'
import { getProperty, updatePropertyStatus } from '@/lib/db/queries/properties'
import { createContact, deleteContactsForProperty } from '@/lib/db/queries/contacts'
import { skipTrace } from '@/lib/skip-trace'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10)
    const property = getProperty(id)
    if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!property.owner_name) {
      return NextResponse.json({
        error: 'No owner name on file. Import a PropStream CSV with owner info first.',
        searchUrls: null,
      }, { status: 422 })
    }

    const { results, searchUrls } = await skipTrace({
      owner_name: property.owner_name,
      address: property.address,
      city: property.city,
      state: property.state,
      zip: property.zip,
    })

    if (results.length > 0) {
      // Replace existing contacts with fresh skip trace results
      deleteContactsForProperty(id)

      for (const result of results) {
        createContact({
          property_id: id,
          full_name: result.full_name,
          relationship: 'Owner',
          email: result.emails[0] ?? undefined,
          age: result.age ?? undefined,
          phones: result.phones.map((p, i) => ({
            phone: p.number,
            phone_type: p.type ?? undefined,
            rank: i,
          })),
        })
      }

      updatePropertyStatus(id, 'skip_traced')
    }

    return NextResponse.json({
      ok: true,
      found: results.length > 0,
      contacts_created: results.length,
      phone_count: results.reduce((n, r) => n + r.phones.length, 0),
      searchUrls,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
