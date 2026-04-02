import { getDb } from '../index'
import type { OutreachMessage, OutreachType, OutreachStatus } from '@/types/outreach'

export function getOutreachForProperty(propertyId: number): OutreachMessage[] {
  return getDb().prepare<[number], OutreachMessage>(
    'SELECT * FROM outreach_messages WHERE property_id = ? ORDER BY created_at DESC'
  ).all(propertyId)
}

export function createOutreachMessage(data: {
  property_id: number
  contact_id?: number
  campaign_id?: number
  message_type: OutreachType
  subject?: string
  body: string
  ai_model?: string
  prompt_tokens?: number
}): OutreachMessage {
  return getDb().prepare<object, OutreachMessage>(`
    INSERT INTO outreach_messages (
      property_id, contact_id, campaign_id, message_type,
      subject, body, ai_model, prompt_tokens
    ) VALUES (
      @property_id, @contact_id, @campaign_id, @message_type,
      @subject, @body, @ai_model, @prompt_tokens
    )
    RETURNING *
  `).get({
    property_id: data.property_id,
    contact_id: data.contact_id ?? null,
    campaign_id: data.campaign_id ?? null,
    message_type: data.message_type,
    subject: data.subject ?? null,
    body: data.body,
    ai_model: data.ai_model ?? null,
    prompt_tokens: data.prompt_tokens ?? null,
  }) as OutreachMessage
}

export function updateOutreachStatus(id: number, status: OutreachStatus, notes?: string): void {
  const db = getDb()
  const now = Math.floor(Date.now() / 1000)
  const sentAt = ['sent', 'delivered', 'replied', 'no_answer', 'left_vm', 'not_interested', 'interested', 'dnc'].includes(status) ? now : null
  const repliedAt = status === 'replied' ? now : null

  db.prepare(`
    UPDATE outreach_messages
    SET status = ?, notes = COALESCE(?, notes), sent_at = COALESCE(@sentAt, sent_at),
        replied_at = COALESCE(@repliedAt, replied_at), updated_at = unixepoch()
    WHERE id = ?
  `).run(status, notes ?? null, id)

  if (sentAt) db.prepare('UPDATE outreach_messages SET sent_at = ? WHERE id = ? AND sent_at IS NULL').run(sentAt, id)
  if (repliedAt) db.prepare('UPDATE outreach_messages SET replied_at = ? WHERE id = ?').run(repliedAt, id)
}

export function getRecentActivity(limit = 10): Array<OutreachMessage & { property_address: string }> {
  return getDb().prepare<[number], OutreachMessage & { property_address: string }>(`
    SELECT o.*, p.address || ', ' || p.city || ', ' || p.state as property_address
    FROM outreach_messages o
    JOIN properties p ON o.property_id = p.id
    ORDER BY o.created_at DESC
    LIMIT ?
  `).all(limit)
}
