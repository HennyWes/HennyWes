export interface ContactPhone {
  id: number
  contact_id: number
  phone: string
  phone_type: 'mobile' | 'landline' | 'voip' | null
  do_not_call: number
  rank: number
  created_at: number
}

export interface Contact {
  id: number
  property_id: number
  full_name: string | null
  relationship: string | null
  email: string | null
  age: number | null
  deceased: number
  created_at: number
  phones?: ContactPhone[]
}

export interface CreateContactInput {
  property_id: number
  full_name?: string
  relationship?: string
  email?: string
  age?: number
  phones?: Array<{
    phone: string
    phone_type?: 'mobile' | 'landline' | 'voip'
    rank?: number
  }>
}
