'use client'
import { useState } from 'react'
import { formatCurrency } from '@/lib/utils/format'

interface SearchResult {
  id: string
  address: string
  city: string
  state: string
  zip: string
  propertyType?: string
  bedrooms?: number
  bathrooms?: number
  squareFeet?: number
  yearBuilt?: number
  estimatedValue?: number
  equityPercent?: number
  preForeclosure?: boolean
  taxDelinquent?: boolean
  vacant?: boolean
  absenteeOwner?: boolean
  ownerName?: string
}

interface SearchResponse {
  total: number
  results: SearchResult[]
}

export default function SearchPage() {
  const [form, setForm] = useState({
    state: '', city: '', zip: '',
    equity_percent_min: '',
    estimated_value_max: '',
    pre_foreclosure: false,
    tax_delinquent: false,
    vacant: false,
    absentee_owner: false,
  })
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState<Set<string>>(new Set())
  const [added, setAdded] = useState<Set<string>>(new Set())

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const body: Record<string, unknown> = {}
      if (form.state) body.state = form.state
      if (form.city) body.city = form.city
      if (form.zip) body.zip = form.zip
      if (form.equity_percent_min) body.equity_percent_min = parseFloat(form.equity_percent_min)
      if (form.estimated_value_max) body.estimated_value_max = parseFloat(form.estimated_value_max)
      if (form.pre_foreclosure) body.pre_foreclosure = true
      if (form.tax_delinquent) body.tax_delinquent = true
      if (form.vacant) body.vacant = true
      if (form.absentee_owner) body.absentee_owner = true

      const res = await fetch('/api/propstream/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResults(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  async function addToLeads(r: SearchResult) {
    setAdding((s) => new Set(s).add(r.id))
    try {
      await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          external_id: r.id,
          address: r.address,
          city: r.city,
          state: r.state,
          zip: r.zip,
          property_type: r.propertyType,
          bedrooms: r.bedrooms,
          bathrooms: r.bathrooms,
          sq_ft: r.squareFeet,
          year_built: r.yearBuilt,
          estimated_value: r.estimatedValue,
          equity_percent: r.equityPercent,
          pre_foreclosure: r.preForeclosure,
          tax_delinquent: r.taxDelinquent,
          vacant: r.vacant,
          absentee_owner: r.absenteeOwner,
          owner_name: r.ownerName,
          source: 'propstream_api',
        }),
      })
      setAdded((s) => new Set(s).add(r.id))
    } finally {
      setAdding((s) => { const n = new Set(s); n.delete(r.id); return n })
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Search PropStream</h1>
        <p className="text-sm text-gray-500 mt-1">Requires PropStream API access. Configure credentials in Settings.</p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="card p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">State</label>
            <input className="input text-sm" placeholder="TX" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">City</label>
            <input className="input text-sm" placeholder="Austin" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">ZIP Code</label>
            <input className="input text-sm" placeholder="78701" value={form.zip} onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Min Equity %</label>
            <input className="input text-sm" placeholder="30" type="number" value={form.equity_percent_min} onChange={(e) => setForm((f) => ({ ...f, equity_percent_min: e.target.value }))} />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          {[
            ['pre_foreclosure', 'Pre-Foreclosure'],
            ['tax_delinquent', 'Tax Delinquent'],
            ['vacant', 'Vacant'],
            ['absentee_owner', 'Absentee Owner'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form[key as keyof typeof form] as boolean}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                className="rounded border-gray-300"
              />
              {label}
            </label>
          ))}
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Searching...' : 'Search PropStream'}
        </button>
      </form>

      {error && (
        <div className="card p-4 bg-red-50 border-red-200 text-red-700 text-sm">
          {error}
          {error.includes('credentials') && (
            <> — <a href="/settings" className="underline">Configure in Settings</a></>
          )}
        </div>
      )}

      {/* Results */}
      {results && (
        <div>
          <div className="text-sm text-gray-500 mb-3">{results.total.toLocaleString()} results found</div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {results.results.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="font-medium text-gray-900 mb-0.5 truncate">{r.address}</div>
                <div className="text-xs text-gray-500 mb-2">{r.city}, {r.state} {r.zip}</div>

                <div className="flex flex-wrap gap-1 mb-2">
                  {r.preForeclosure && <span className="badge bg-red-100 text-red-700">Pre-FC</span>}
                  {r.taxDelinquent && <span className="badge bg-orange-100 text-orange-700">Tax Del</span>}
                  {r.vacant && <span className="badge bg-yellow-100 text-yellow-700">Vacant</span>}
                  {r.absenteeOwner && <span className="badge bg-blue-100 text-blue-700">Absentee</span>}
                </div>

                <div className="grid grid-cols-2 gap-1 text-xs mb-3">
                  <div><span className="text-gray-500">Value:</span> <strong>{formatCurrency(r.estimatedValue)}</strong></div>
                  <div><span className="text-gray-500">Equity:</span> <strong>{r.equityPercent != null ? `${r.equityPercent.toFixed(0)}%` : 'N/A'}</strong></div>
                  <div><span className="text-gray-500">Type:</span> {r.propertyType ?? '—'}</div>
                  <div><span className="text-gray-500">Beds/Ba:</span> {r.bedrooms ?? '?'}/{r.bathrooms ?? '?'}</div>
                </div>

                <button
                  onClick={() => addToLeads(r)}
                  disabled={adding.has(r.id) || added.has(r.id)}
                  className={added.has(r.id) ? 'btn-secondary w-full text-xs py-1' : 'btn-primary w-full text-xs py-1'}
                >
                  {adding.has(r.id) ? 'Adding...' : added.has(r.id) ? '✓ In My Leads' : '+ Add to My Leads'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
