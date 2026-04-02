'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { formatCurrency, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/format'
import type { Property, PropertyStatus } from '@/types/property'

const STATUS_OPTIONS: PropertyStatus[] = ['new', 'skip_traced', 'contacted', 'negotiating', 'under_contract', 'dead', 'dnc']

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | ''>('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    params.set('limit', String(PAGE_SIZE))
    params.set('offset', String(page * PAGE_SIZE))

    const res = await fetch(`/api/properties?${params}`)
    const data = await res.json()
    setProperties(data.properties ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [search, statusFilter, page])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Leads <span className="text-gray-400 font-normal text-lg">({total})</span></h1>
        <div className="flex gap-2">
          <Link href="/import" className="btn-secondary text-sm">+ Import CSV</Link>
          <Link href="/calling" className="btn-primary text-sm">☎ Start Calling</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          className="input max-w-64 text-sm"
          placeholder="Search address, owner..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
        />
        <select
          className="input w-44 text-sm"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as PropertyStatus | ''); setPage(0) }}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card p-8 text-center text-gray-400">Loading...</div>
      ) : properties.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-gray-400 mb-4">No leads found.</div>
          <Link href="/import" className="btn-primary">Import from PropStream</Link>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Est. Value</th>
                <th className="px-4 py-3">Equity</th>
                <th className="px-4 py-3">Flags</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {properties.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 truncate max-w-48">{p.address}</div>
                    <div className="text-xs text-gray-400">{p.city}, {p.state} {p.zip}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 truncate max-w-36">{p.owner_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{p.property_type ?? '—'}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(p.estimated_value)}</td>
                  <td className="px-4 py-3">
                    {p.equity_percent != null ? (
                      <span className={`font-medium ${p.equity_percent >= 40 ? 'text-green-600' : 'text-gray-700'}`}>
                        {p.equity_percent.toFixed(0)}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {p.pre_foreclosure ? <span className="badge bg-red-100 text-red-700">Pre-FC</span> : null}
                      {p.tax_delinquent ? <span className="badge bg-orange-100 text-orange-700">Tax Del</span> : null}
                      {p.vacant ? <span className="badge bg-yellow-100 text-yellow-700">Vacant</span> : null}
                      {p.absentee_owner ? <span className="badge bg-blue-100 text-blue-700">Absentee</span> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_COLORS[p.status]}`}>{STATUS_LABELS[p.status]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/properties/${p.id}`} className="btn-ghost text-xs py-1 px-2">Open →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</span>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1">← Prev</button>
            <button disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1">Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}
