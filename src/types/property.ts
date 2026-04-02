export type PropertyStatus =
  | 'new'
  | 'skip_traced'
  | 'contacted'
  | 'negotiating'
  | 'under_contract'
  | 'dead'
  | 'dnc'

export type PropertySource = 'propstream_api' | 'csv_import' | 'manual'

export type PropertyType =
  | 'SFR'
  | 'Multi-Family'
  | 'Condo'
  | 'Townhouse'
  | 'Mobile Home'
  | 'Commercial'
  | 'Land'
  | 'Other'

export interface Property {
  id: number
  external_id: string | null
  address: string
  city: string
  state: string
  zip: string
  county: string | null
  parcel_number: string | null
  property_type: string | null
  bedrooms: number | null
  bathrooms: number | null
  sq_ft: number | null
  lot_size_sqft: number | null
  year_built: number | null
  stories: number | null
  garage: string | null
  pool: number

  // Valuation
  estimated_value: number | null
  assessed_value: number | null
  tax_assessed_value: number | null
  last_sale_price: number | null
  last_sale_date: string | null

  // Equity / Distress
  estimated_equity: number | null
  equity_percent: number | null
  mortgage_balance: number | null
  open_lien_count: number
  lien_amount: number | null
  pre_foreclosure: number
  foreclosure: number
  reo: number
  bankruptcy: number
  tax_delinquent: number
  vacant: number
  absentee_owner: number

  // Owner
  owner_name: string | null
  owner_mailing_address: string | null
  owner_mailing_city: string | null
  owner_mailing_state: string | null
  owner_mailing_zip: string | null

  // Pipeline
  status: PropertyStatus
  source: PropertySource
  import_batch_id: string | null
  notes: string | null
  arv: number | null
  max_offer: number | null

  created_at: number
  updated_at: number
}

export interface PropertyWithContacts extends Property {
  contacts: import('./contact').Contact[]
}

export interface PropertySearchFilters {
  state?: string
  county?: string
  city?: string
  zip?: string
  property_type?: string
  bedrooms_min?: number
  bedrooms_max?: number
  bathrooms_min?: number
  sq_ft_min?: number
  sq_ft_max?: number
  year_built_min?: number
  year_built_max?: number
  estimated_value_min?: number
  estimated_value_max?: number
  equity_percent_min?: number
  pre_foreclosure?: boolean
  tax_delinquent?: boolean
  vacant?: boolean
  absentee_owner?: boolean
  page?: number
  page_size?: number
}

export interface CreatePropertyInput {
  external_id?: string
  address: string
  city: string
  state: string
  zip: string
  county?: string
  parcel_number?: string
  property_type?: string
  bedrooms?: number
  bathrooms?: number
  sq_ft?: number
  lot_size_sqft?: number
  year_built?: number
  stories?: number
  garage?: string
  pool?: boolean
  estimated_value?: number
  assessed_value?: number
  tax_assessed_value?: number
  last_sale_price?: number
  last_sale_date?: string
  estimated_equity?: number
  equity_percent?: number
  mortgage_balance?: number
  open_lien_count?: number
  lien_amount?: number
  pre_foreclosure?: boolean
  foreclosure?: boolean
  reo?: boolean
  bankruptcy?: boolean
  tax_delinquent?: boolean
  vacant?: boolean
  absentee_owner?: boolean
  owner_name?: string
  owner_mailing_address?: string
  owner_mailing_city?: string
  owner_mailing_state?: string
  owner_mailing_zip?: string
  source?: PropertySource
  import_batch_id?: string
  notes?: string
}
