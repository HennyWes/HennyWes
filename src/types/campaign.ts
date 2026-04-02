export type CampaignStatus = 'active' | 'paused' | 'completed'

export interface Campaign {
  id: number
  name: string
  description: string | null
  status: CampaignStatus
  created_at: number
  updated_at: number
  property_count?: number
}

export interface CreateCampaignInput {
  name: string
  description?: string
}
