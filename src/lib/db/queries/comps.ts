import { getDb } from '../index'
import type { Comp, CompsAnalysis } from '@/types/comps'

export function getCompsForProperty(propertyId: number): Comp[] {
  return getDb().prepare<[number], Comp>(
    'SELECT * FROM comps WHERE property_id = ? ORDER BY sale_date DESC'
  ).all(propertyId)
}

export function saveComps(propertyId: number, comps: Omit<Comp, 'id' | 'property_id' | 'pulled_at' | 'arv_contribution'>[]): Comp[] {
  const db = getDb()

  // Clear old comps for this property
  db.prepare('DELETE FROM comps WHERE property_id = ?').run(propertyId)

  const stmt = db.prepare(`
    INSERT INTO comps (
      property_id, comp_address, comp_city, comp_state, comp_zip,
      sale_price, sale_date, sq_ft, bedrooms, bathrooms, year_built,
      distance_miles, price_per_sqft
    ) VALUES (
      @property_id, @comp_address, @comp_city, @comp_state, @comp_zip,
      @sale_price, @sale_date, @sq_ft, @bedrooms, @bathrooms, @year_built,
      @distance_miles, @price_per_sqft
    )
  `)

  const insertAll = db.transaction(() => {
    for (const comp of comps) {
      stmt.run({
        property_id: propertyId,
        comp_address: comp.comp_address,
        comp_city: comp.comp_city ?? null,
        comp_state: comp.comp_state ?? null,
        comp_zip: comp.comp_zip ?? null,
        sale_price: comp.sale_price,
        sale_date: comp.sale_date,
        sq_ft: comp.sq_ft ?? null,
        bedrooms: comp.bedrooms ?? null,
        bathrooms: comp.bathrooms ?? null,
        year_built: comp.year_built ?? null,
        distance_miles: comp.distance_miles ?? null,
        price_per_sqft: comp.price_per_sqft ?? null,
      })
    }
  })
  insertAll()

  return getCompsForProperty(propertyId)
}

export function analyzeComps(comps: Comp[], subjectSqFt?: number | null): CompsAnalysis {
  if (!comps.length) {
    return { comps, median_price_per_sqft: null, suggested_arv: null, suggested_max_offer: null, comp_count: 0 }
  }

  const withPpsqft = comps.filter((c) => c.price_per_sqft && c.price_per_sqft > 0)
  if (!withPpsqft.length) {
    return { comps, median_price_per_sqft: null, suggested_arv: null, suggested_max_offer: null, comp_count: comps.length }
  }

  const sorted = [...withPpsqft].sort((a, b) => a.price_per_sqft! - b.price_per_sqft!)
  const mid = Math.floor(sorted.length / 2)
  const median_price_per_sqft =
    sorted.length % 2 === 0
      ? (sorted[mid - 1].price_per_sqft! + sorted[mid].price_per_sqft!) / 2
      : sorted[mid].price_per_sqft!

  const suggested_arv = subjectSqFt ? Math.round(median_price_per_sqft * subjectSqFt) : null
  const suggested_max_offer = suggested_arv ? Math.round(suggested_arv * 0.7) : null

  return { comps, median_price_per_sqft, suggested_arv, suggested_max_offer, comp_count: comps.length }
}
