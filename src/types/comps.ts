export interface Comp {
  id: number
  property_id: number
  comp_address: string
  comp_city: string | null
  comp_state: string | null
  comp_zip: string | null
  sale_price: number
  sale_date: string
  sq_ft: number | null
  bedrooms: number | null
  bathrooms: number | null
  year_built: number | null
  distance_miles: number | null
  price_per_sqft: number | null
  arv_contribution: number
  pulled_at: number
}

export interface CompsAnalysis {
  comps: Comp[]
  median_price_per_sqft: number | null
  suggested_arv: number | null
  suggested_max_offer: number | null
  comp_count: number
}
