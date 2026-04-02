import { propstreamFetch } from './client'
import type { PropertySearchFilters } from '@/types/property'

export interface PropStreamPropertyResult {
  id: string
  address: string
  city: string
  state: string
  zip: string
  county?: string
  parcelNumber?: string
  propertyType?: string
  bedrooms?: number
  bathrooms?: number
  squareFeet?: number
  lotSizeSqFt?: number
  yearBuilt?: number
  estimatedValue?: number
  assessedValue?: number
  taxAssessedValue?: number
  lastSalePrice?: number
  lastSaleDate?: string
  estimatedEquity?: number
  equityPercent?: number
  mortgageBalance?: number
  openLienCount?: number
  lienAmount?: number
  preForeclosure?: boolean
  foreclosure?: boolean
  reo?: boolean
  bankruptcy?: boolean
  taxDelinquent?: boolean
  vacant?: boolean
  absenteeOwner?: boolean
  ownerName?: string
  ownerMailingAddress?: string
  ownerMailingCity?: string
  ownerMailingState?: string
  ownerMailingZip?: string
}

export interface PropStreamSearchResponse {
  total: number
  page: number
  pageSize: number
  results: PropStreamPropertyResult[]
}

export async function searchProperties(filters: PropertySearchFilters): Promise<PropStreamSearchResponse> {
  const body: Record<string, unknown> = {}

  if (filters.state) body.state = filters.state
  if (filters.county) body.county = filters.county
  if (filters.city) body.city = filters.city
  if (filters.zip) body.zip = filters.zip
  if (filters.property_type) body.propertyType = filters.property_type
  if (filters.bedrooms_min) body.bedroomsMin = filters.bedrooms_min
  if (filters.bedrooms_max) body.bedroomsMax = filters.bedrooms_max
  if (filters.bathrooms_min) body.bathroomsMin = filters.bathrooms_min
  if (filters.sq_ft_min) body.squareFeetMin = filters.sq_ft_min
  if (filters.sq_ft_max) body.squareFeetMax = filters.sq_ft_max
  if (filters.year_built_min) body.yearBuiltMin = filters.year_built_min
  if (filters.year_built_max) body.yearBuiltMax = filters.year_built_max
  if (filters.estimated_value_min) body.estimatedValueMin = filters.estimated_value_min
  if (filters.estimated_value_max) body.estimatedValueMax = filters.estimated_value_max
  if (filters.equity_percent_min) body.equityPercentMin = filters.equity_percent_min
  if (filters.pre_foreclosure) body.preForeclosure = true
  if (filters.tax_delinquent) body.taxDelinquent = true
  if (filters.vacant) body.vacant = true
  if (filters.absentee_owner) body.absenteeOwner = true

  body.page = filters.page ?? 1
  body.pageSize = filters.page_size ?? 25

  return propstreamFetch<PropStreamSearchResponse>('/properties/search', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
