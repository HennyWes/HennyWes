import { propstreamFetch } from './client'

export interface PropStreamComp {
  address: string
  city: string
  state: string
  zip: string
  salePrice: number
  saleDate: string
  squareFeet?: number
  bedrooms?: number
  bathrooms?: number
  yearBuilt?: number
  distanceMiles?: number
  pricePerSqFt?: number
}

export interface PropStreamCompsResponse {
  comps: PropStreamComp[]
}

export async function fetchComps(params: {
  propertyId: string
  radiusMiles?: number
  bedroomsMin?: number
  bedroomsMax?: number
  bathroomsMin?: number
  squareFeetMin?: number
  squareFeetMax?: number
  propertyType?: string
}): Promise<PropStreamCompsResponse> {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const saleDateMin = oneYearAgo.toISOString().split('T')[0]

  return propstreamFetch<PropStreamCompsResponse>('/comps', {
    method: 'POST',
    body: JSON.stringify({
      propertyId: params.propertyId,
      radiusMiles: params.radiusMiles ?? 0.5,
      saleDateMin,
      propertyType: params.propertyType,
      bedroomsMin: params.bedroomsMin,
      bedroomsMax: params.bedroomsMax,
      bathroomsMin: params.bathroomsMin,
      squareFeetMin: params.squareFeetMin,
      squareFeetMax: params.squareFeetMax,
    }),
  })
}
