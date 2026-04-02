import { NextRequest, NextResponse } from 'next/server'
import { getProperty } from '@/lib/db/queries/properties'
import { saveComps, getCompsForProperty, analyzeComps } from '@/lib/db/queries/comps'
import { fetchComps } from '@/lib/propstream/comps'
import type { Comp } from '@/types/comps'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10)
    const property = getProperty(id)
    if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const comps = getCompsForProperty(id)
    const analysis = analyzeComps(comps, property.sq_ft)
    return NextResponse.json(analysis)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10)
    const property = getProperty(id)
    if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!property.external_id) {
      return NextResponse.json(
        { error: 'No PropStream ID on this property. Use CSV import with a PropStream export, or search via PropStream API.' },
        { status: 422 }
      )
    }

    const response = await fetchComps({
      propertyId: property.external_id,
      bedroomsMin: property.bedrooms ? Math.max(1, property.bedrooms - 1) : undefined,
      bedroomsMax: property.bedrooms ? property.bedrooms + 1 : undefined,
      squareFeetMin: property.sq_ft ? Math.round(property.sq_ft * 0.8) : undefined,
      squareFeetMax: property.sq_ft ? Math.round(property.sq_ft * 1.2) : undefined,
      propertyType: property.property_type ?? undefined,
    })

    const compsToSave = response.comps.map((c) => ({
      comp_address: c.address,
      comp_city: c.city,
      comp_state: c.state,
      comp_zip: c.zip,
      sale_price: c.salePrice,
      sale_date: c.saleDate,
      sq_ft: c.squareFeet ?? null,
      bedrooms: c.bedrooms ?? null,
      bathrooms: c.bathrooms ?? null,
      year_built: c.yearBuilt ?? null,
      distance_miles: c.distanceMiles ?? null,
      price_per_sqft: c.pricePerSqFt ?? (c.squareFeet ? Math.round(c.salePrice / c.squareFeet) : null),
    }))

    const saved = saveComps(id, compsToSave as Omit<Comp, 'id' | 'property_id' | 'pulled_at' | 'arv_contribution'>[])
    const analysis = analyzeComps(saved, property.sq_ft)
    return NextResponse.json(analysis)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
