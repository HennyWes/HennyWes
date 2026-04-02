export type OutreachType = 'call_script' | 'sms' | 'email'

export type OutreachStatus =
  | 'generated'
  | 'sent'
  | 'delivered'
  | 'replied'
  | 'no_answer'
  | 'left_vm'
  | 'not_interested'
  | 'interested'
  | 'dnc'

export interface OutreachMessage {
  id: number
  property_id: number
  contact_id: number | null
  campaign_id: number | null
  message_type: OutreachType
  subject: string | null
  body: string
  status: OutreachStatus
  sent_at: number | null
  replied_at: number | null
  notes: string | null
  ai_model: string | null
  prompt_tokens: number | null
  created_at: number
  updated_at: number
}

export interface GenerateOutreachRequest {
  property_id: number
  types: OutreachType[]
}

export interface GenerateOutreachResponse {
  call_script?: string
  sms?: string
  email?: { subject: string; body: string }
}
