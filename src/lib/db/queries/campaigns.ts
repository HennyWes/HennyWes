import { getDb } from '../index'
import type { Campaign, CreateCampaignInput, CampaignStatus } from '@/types/campaign'

export function listCampaigns(): Campaign[] {
  return getDb().prepare<[], Campaign & { property_count: number }>(`
    SELECT c.*, COUNT(cp.property_id) as property_count
    FROM campaigns c
    LEFT JOIN campaign_properties cp ON c.id = cp.campaign_id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `).all()
}

export function getCampaign(id: number): Campaign | null {
  return getDb().prepare<[number], Campaign>('SELECT * FROM campaigns WHERE id = ?').get(id) ?? null
}

export function createCampaign(input: CreateCampaignInput): Campaign {
  return getDb().prepare<object, Campaign>(`
    INSERT INTO campaigns (name, description)
    VALUES (@name, @description)
    RETURNING *
  `).get({ name: input.name, description: input.description ?? null }) as Campaign
}

export function updateCampaignStatus(id: number, status: CampaignStatus): void {
  getDb().prepare('UPDATE campaigns SET status = ?, updated_at = unixepoch() WHERE id = ?').run(status, id)
}

export function deleteCampaign(id: number): void {
  getDb().prepare('DELETE FROM campaigns WHERE id = ?').run(id)
}

export function addPropertyToCampaign(campaignId: number, propertyId: number): void {
  getDb().prepare(`
    INSERT OR IGNORE INTO campaign_properties (campaign_id, property_id) VALUES (?, ?)
  `).run(campaignId, propertyId)
}

export function removePropertyFromCampaign(campaignId: number, propertyId: number): void {
  getDb().prepare('DELETE FROM campaign_properties WHERE campaign_id = ? AND property_id = ?').run(campaignId, propertyId)
}

export function getCampaignPropertyIds(campaignId: number): number[] {
  const rows = getDb().prepare<[number], { property_id: number }>(
    'SELECT property_id FROM campaign_properties WHERE campaign_id = ?'
  ).all(campaignId)
  return rows.map((r) => r.property_id)
}
