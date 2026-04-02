'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Campaign } from '@/types/campaign'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch('/api/campaigns').then((r) => r.json()).then((d) => { setCampaigns(d); setLoading(false) })
  }, [])

  async function create() {
    if (!newName.trim()) return
    setCreating(true)
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    })
    const camp = await res.json()
    setCampaigns((prev) => [camp, ...prev])
    setNewName('')
    setCreating(false)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Campaigns</h1>

      <div className="flex gap-3">
        <input
          className="input flex-1"
          placeholder="New campaign name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
        />
        <button onClick={create} disabled={creating || !newName.trim()} className="btn-primary">
          + Create
        </button>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-400">Loading...</div>
      ) : campaigns.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">No campaigns yet. Create one above.</div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="card p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{c.name}</div>
                {c.description && <div className="text-sm text-gray-500">{c.description}</div>}
                <div className="text-xs text-gray-400 mt-1">{c.property_count ?? 0} properties</div>
              </div>
              <div className="flex gap-2">
                <span className={`badge ${c.status === 'active' ? 'bg-green-100 text-green-700' : c.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
