import { getDb } from '../index'
import type { Property, CreatePropertyInput, PropertyStatus } from '@/types/property'

export function getProperty(id: number): Property | null {
  return getDb().prepare<[number], Property>('SELECT * FROM properties WHERE id = ?').get(id) ?? null
}

export function listProperties(filters: {
  status?: PropertyStatus
  state?: string
  zip?: string
  search?: string
  limit?: number
  offset?: number
} = {}): { properties: Property[]; total: number } {
  const db = getDb()
  const wheres: string[] = []
  const params: (string | number)[] = []

  if (filters.status) {
    wheres.push('status = ?')
    params.push(filters.status)
  }
  if (filters.state) {
    wheres.push('state = ?')
    params.push(filters.state)
  }
  if (filters.zip) {
    wheres.push('zip = ?')
    params.push(filters.zip)
  }
  if (filters.search) {
    wheres.push("(address LIKE ? OR owner_name LIKE ? OR city LIKE ?)")
    const q = `%${filters.search}%`
    params.push(q, q, q)
  }

  const where = wheres.length ? `WHERE ${wheres.join(' AND ')}` : ''
  const limit = filters.limit ?? 50
  const offset = filters.offset ?? 0

  const total = (db.prepare<(string | number)[], { count: number }>(
    `SELECT COUNT(*) as count FROM properties ${where}`
  ).get(...params) as { count: number }).count

  const properties = db.prepare<(string | number)[], Property>(
    `SELECT * FROM properties ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset)

  return { properties, total }
}

export function createProperty(input: CreatePropertyInput): Property {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO properties (
      external_id, address, city, state, zip, county, parcel_number,
      property_type, bedrooms, bathrooms, sq_ft, lot_size_sqft, year_built,
      stories, garage, pool,
      estimated_value, assessed_value, tax_assessed_value,
      last_sale_price, last_sale_date,
      estimated_equity, equity_percent, mortgage_balance,
      open_lien_count, lien_amount,
      pre_foreclosure, foreclosure, reo, bankruptcy, tax_delinquent, vacant, absentee_owner,
      owner_name, owner_mailing_address, owner_mailing_city, owner_mailing_state, owner_mailing_zip,
      source, import_batch_id, notes
    ) VALUES (
      @external_id, @address, @city, @state, @zip, @county, @parcel_number,
      @property_type, @bedrooms, @bathrooms, @sq_ft, @lot_size_sqft, @year_built,
      @stories, @garage, @pool,
      @estimated_value, @assessed_value, @tax_assessed_value,
      @last_sale_price, @last_sale_date,
      @estimated_equity, @equity_percent, @mortgage_balance,
      @open_lien_count, @lien_amount,
      @pre_foreclosure, @foreclosure, @reo, @bankruptcy, @tax_delinquent, @vacant, @absentee_owner,
      @owner_name, @owner_mailing_address, @owner_mailing_city, @owner_mailing_state, @owner_mailing_zip,
      @source, @import_batch_id, @notes
    )
    ON CONFLICT(external_id) DO UPDATE SET
      address = excluded.address,
      city = excluded.city,
      state = excluded.state,
      updated_at = unixepoch()
    RETURNING *
  `)

  return stmt.get({
    external_id: input.external_id ?? null,
    address: input.address,
    city: input.city,
    state: input.state,
    zip: input.zip,
    county: input.county ?? null,
    parcel_number: input.parcel_number ?? null,
    property_type: input.property_type ?? null,
    bedrooms: input.bedrooms ?? null,
    bathrooms: input.bathrooms ?? null,
    sq_ft: input.sq_ft ?? null,
    lot_size_sqft: input.lot_size_sqft ?? null,
    year_built: input.year_built ?? null,
    stories: input.stories ?? null,
    garage: input.garage ?? null,
    pool: input.pool ? 1 : 0,
    estimated_value: input.estimated_value ?? null,
    assessed_value: input.assessed_value ?? null,
    tax_assessed_value: input.tax_assessed_value ?? null,
    last_sale_price: input.last_sale_price ?? null,
    last_sale_date: input.last_sale_date ?? null,
    estimated_equity: input.estimated_equity ?? null,
    equity_percent: input.equity_percent ?? null,
    mortgage_balance: input.mortgage_balance ?? null,
    open_lien_count: input.open_lien_count ?? 0,
    lien_amount: input.lien_amount ?? null,
    pre_foreclosure: input.pre_foreclosure ? 1 : 0,
    foreclosure: input.foreclosure ? 1 : 0,
    reo: input.reo ? 1 : 0,
    bankruptcy: input.bankruptcy ? 1 : 0,
    tax_delinquent: input.tax_delinquent ? 1 : 0,
    vacant: input.vacant ? 1 : 0,
    absentee_owner: input.absentee_owner ? 1 : 0,
    owner_name: input.owner_name ?? null,
    owner_mailing_address: input.owner_mailing_address ?? null,
    owner_mailing_city: input.owner_mailing_city ?? null,
    owner_mailing_state: input.owner_mailing_state ?? null,
    owner_mailing_zip: input.owner_mailing_zip ?? null,
    source: input.source ?? 'manual',
    import_batch_id: input.import_batch_id ?? null,
    notes: input.notes ?? null,
  }) as Property
}

export function updatePropertyStatus(id: number, status: PropertyStatus): void {
  getDb().prepare('UPDATE properties SET status = ?, updated_at = unixepoch() WHERE id = ?').run(status, id)
}

export function updateProperty(id: number, updates: Partial<CreatePropertyInput & { status: PropertyStatus; notes: string; arv: number; max_offer: number }>): Property | null {
  const db = getDb()
  const fields = Object.keys(updates)
    .map((k) => `${k} = @${k}`)
    .join(', ')
  if (!fields) return getProperty(id)

  db.prepare(`UPDATE properties SET ${fields}, updated_at = unixepoch() WHERE id = @id`).run({
    ...updates,
    id,
  })
  return getProperty(id)
}

export function deleteProperty(id: number): void {
  getDb().prepare('DELETE FROM properties WHERE id = ?').run(id)
}

export function getDashboardStats(): {
  total: number
  skip_traced: number
  contacted: number
  interested: number
} {
  const db = getDb()
  const total = (db.prepare<[], { count: number }>('SELECT COUNT(*) as count FROM properties').get() as { count: number }).count
  const skip_traced = (db.prepare<[], { count: number }>("SELECT COUNT(*) as count FROM properties WHERE status != 'new'").get() as { count: number }).count
  const contacted = (db.prepare<[], { count: number }>("SELECT COUNT(*) as count FROM properties WHERE status IN ('contacted','negotiating','under_contract')").get() as { count: number }).count
  const interested = (db.prepare<[], { count: number }>("SELECT COUNT(DISTINCT property_id) as count FROM outreach_messages WHERE status = 'interested'").get() as { count: number }).count
  return { total, skip_traced, contacted, interested }
}

export function getPipelineByStatus(): Record<string, number> {
  const db = getDb()
  const rows = db.prepare<[], { status: string; count: number }>(
    'SELECT status, COUNT(*) as count FROM properties GROUP BY status'
  ).all()
  return Object.fromEntries(rows.map((r) => [r.status, r.count]))
}
