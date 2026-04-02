'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { formatCurrency, formatDate, formatPhone, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/format'
import type { Property, PropertyStatus } from '@/types/property'
import type { Contact } from '@/types/contact'
import type { CompsAnalysis } from '@/types/comps'
import type { OutreachMessage, OutreachType } from '@/types/outreach'
import { buildTruePeopleSearchUrl, buildLookupIoUrl } from '@/lib/skip-trace/urls'

interface PageData {
  property: Property
  contacts: Contact[]
  compsAnalysis: CompsAnalysis
  outreach: OutreachMessage[]
}

const STATUSES: PropertyStatus[] = ['new','skip_traced','contacted','negotiating','under_contract','dead','dnc']

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [skipTracing, setSkipTracing] = useState(false)
  const [runningComps, setRunningComps] = useState(false)
  const [generatingTypes, setGeneratingTypes] = useState<OutreachType[]>([])
  const [generated, setGenerated] = useState<Record<string, unknown>>({})
  const [copiedKey, setCopiedKey] = useState('')
  const [activeTab, setActiveTab] = useState<OutreachType>('call_script')
  const [notes, setNotes] = useState('')
  const [statusMsg, setStatusMsg] = useState('')

  const load = useCallback(async () => {
    const res = await fetch(`/api/properties/${params.id}`)
    if (res.ok) {
      const d = await res.json()
      setData(d)
      setNotes(d.property.notes ?? '')
    }
    setLoading(false)
  }, [params.id])

  useEffect(() => { load() }, [load])

  async function runSkipTrace() {
    setSkipTracing(true)
    setStatusMsg('')
    const res = await fetch(`/api/properties/${params.id}/skip-trace`, { method: 'POST' })
    const d = await res.json()
    if (res.ok) {
      setStatusMsg(d.found ? `Found ${d.phone_count} phone numbers` : 'No results — try searching manually below')
      await load()
    } else {
      setStatusMsg(d.error)
    }
    setSkipTracing(false)
  }

  async function runComps() {
    setRunningComps(true)
    const res = await fetch(`/api/properties/${params.id}/comps`, { method: 'POST' })
    const d = await res.json()
    if (res.ok) await load()
    else setStatusMsg(d.error)
    setRunningComps(false)
  }

  async function generate(types: OutreachType[]) {
    setGeneratingTypes(types)
    const res = await fetch(`/api/properties/${params.id}/outreach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ types }),
    })
    const d = await res.json()
    if (res.ok) {
      setGenerated((prev) => ({ ...prev, ...d }))
      await load()
    } else {
      setStatusMsg(d.error)
    }
    setGeneratingTypes([])
  }

  async function updateStatus(status: PropertyStatus) {
    await fetch(`/api/properties/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await load()
  }

  async function saveNotes() {
    await fetch(`/api/properties/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(''), 2000)
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>
  if (!data) return <div className="p-8 text-center text-red-500">Property not found</div>

  const { property: p, contacts, compsAnalysis } = data
  const allPhones = contacts.flatMap((c) => (c.phones ?? []).map((ph) => ({ ...ph, ownerName: c.full_name })))

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <Link href="/properties" className="text-sm text-gray-400 hover:text-gray-600">← Back to leads</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1">{p.address}</h1>
          <div className="text-gray-500 text-sm">{p.city}, {p.state} {p.zip}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={p.status}
            onChange={(e) => updateStatus(e.target.value as PropertyStatus)}
            className={`badge ${STATUS_COLORS[p.status]} cursor-pointer border-0 text-xs py-1 px-2`}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <Link href={`/calling?id=${p.id}`} className="btn-primary text-sm">☎ Call Now</Link>
        </div>
      </div>

      {statusMsg && (
        <div className="card p-3 mb-4 bg-blue-50 border-blue-200 text-blue-800 text-sm">{statusMsg}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Property Facts */}
        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Property Details</h2>
            <div className="space-y-2 text-sm">
              {[
                ['Type', p.property_type],
                ['Beds/Baths', p.bedrooms != null ? `${p.bedrooms}bd / ${p.bathrooms ?? '?'}ba` : null],
                ['Sq Ft', p.sq_ft?.toLocaleString()],
                ['Year Built', p.year_built],
                ['Lot Size', p.lot_size_sqft ? `${p.lot_size_sqft.toLocaleString()} sqft` : null],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label as string} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Valuation</h2>
            <div className="space-y-2 text-sm">
              {[
                ['Est. Value', formatCurrency(p.estimated_value)],
                ['Equity', p.equity_percent != null ? `${p.equity_percent.toFixed(0)}%` : 'N/A'],
                ['Est. Equity $', formatCurrency(p.estimated_equity)],
                ['Mortgage Bal.', formatCurrency(p.mortgage_balance)],
                ['Last Sale', p.last_sale_price ? `${formatCurrency(p.last_sale_price)} (${formatDate(p.last_sale_date)})` : 'N/A'],
                ['Assessed', formatCurrency(p.assessed_value)],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t space-y-2">
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Your Numbers</div>
              {compsAnalysis.suggested_arv && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Comps ARV</span>
                  <span className="font-bold text-brand-600">{formatCurrency(compsAnalysis.suggested_arv)}</span>
                </div>
              )}
              {compsAnalysis.suggested_max_offer && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Max Offer (70%)</span>
                  <span className="font-bold text-green-600">{formatCurrency(compsAnalysis.suggested_max_offer)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Distress flags */}
          <div className="card p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Distress Signals</h2>
            <div className="flex flex-wrap gap-2">
              {[
                [p.pre_foreclosure, 'Pre-Foreclosure', 'bg-red-100 text-red-700'],
                [p.foreclosure, 'Foreclosure', 'bg-red-200 text-red-800'],
                [p.tax_delinquent, 'Tax Delinquent', 'bg-orange-100 text-orange-700'],
                [p.vacant, 'Vacant', 'bg-yellow-100 text-yellow-700'],
                [p.absentee_owner, 'Absentee Owner', 'bg-blue-100 text-blue-700'],
                [p.bankruptcy, 'Bankruptcy', 'bg-purple-100 text-purple-700'],
                [p.reo, 'REO / Bank Owned', 'bg-gray-200 text-gray-700'],
              ].filter(([flag]) => flag).map(([, label, cls]) => (
                <span key={label as string} className={`badge ${cls}`}>{label as string}</span>
              ))}
              {![p.pre_foreclosure, p.foreclosure, p.tax_delinquent, p.vacant, p.absentee_owner, p.bankruptcy, p.reo].some(Boolean) && (
                <span className="text-sm text-gray-400">None detected</span>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="card p-4">
            <h2 className="font-semibold text-gray-900 mb-2">Notes</h2>
            <textarea
              className="input text-sm"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              placeholder="Add notes..."
            />
          </div>
        </div>

        {/* CENTER: Contacts + Comps */}
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Owner &amp; Contacts</h2>
              <button
                onClick={runSkipTrace}
                disabled={skipTracing}
                className="btn-secondary text-xs py-1"
              >
                {skipTracing ? 'Tracing...' : 'Skip Trace FREE'}
              </button>
            </div>

            {p.owner_name && (
              <div className="text-base font-bold text-gray-900 mb-1">{p.owner_name}</div>
            )}
            {p.owner_mailing_address && (
              <div className="text-xs text-gray-500 mb-3">
                {p.owner_mailing_address}, {p.owner_mailing_city}, {p.owner_mailing_state} {p.owner_mailing_zip}
              </div>
            )}

            {/* Phone numbers — large and prominent for calling */}
            {allPhones.length > 0 ? (
              <div className="space-y-2 mb-3">
                {allPhones.map((ph) => (
                  <div key={ph.id} className={`flex items-center justify-between p-2 rounded-lg ${ph.do_not_call ? 'bg-red-50 opacity-60' : 'bg-green-50'}`}>
                    <div>
                      <a
                        href={`tel:${ph.phone}`}
                        className="text-xl font-mono font-bold text-gray-900 hover:text-brand-600"
                      >
                        {formatPhone(ph.phone)}
                      </a>
                      {ph.phone_type && <span className="ml-2 text-xs text-gray-500">{ph.phone_type}</span>}
                      {ph.do_not_call ? <span className="ml-2 badge bg-red-100 text-red-700">DNC</span> : null}
                    </div>
                    <button
                      onClick={() => fetch(`/api/contacts/${ph.id}/dnc`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ dnc: !ph.do_not_call })
                      }).then(() => load())}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      {ph.do_not_call ? 'Remove DNC' : 'DNC'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-400 mb-3 py-3 text-center border border-dashed rounded-lg">
                No phone numbers yet — run Skip Trace
              </div>
            )}

            {/* Emails */}
            {contacts.some((c) => c.email) && (
              <div className="mb-3">
                {contacts.filter((c) => c.email).map((c) => (
                  <a key={c.id} href={`mailto:${c.email}`} className="text-sm text-blue-600 hover:underline block">
                    {c.email}
                  </a>
                ))}
              </div>
            )}

            {/* Manual search links */}
            {p.owner_name && (
              <div className="pt-3 border-t">
                <div className="text-xs text-gray-500 mb-2">Manual lookup (opens in browser):</div>
                <div className="flex gap-2 flex-wrap">
                  <a
                    href={buildTruePeopleSearchUrl({ owner_name: p.owner_name, address: p.address, city: p.city, state: p.state, zip: p.zip })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="badge bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200"
                  >
                    TruePeopleSearch ↗
                  </a>
                  <a
                    href={buildLookupIoUrl({ owner_name: p.owner_name, address: p.address, city: p.city, state: p.state, zip: p.zip })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="badge bg-purple-100 text-purple-700 cursor-pointer hover:bg-purple-200"
                  >
                    lookup.io ↗
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Comps */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">
                Comps <span className="text-gray-400 font-normal text-sm">({compsAnalysis.comp_count} sales, past year)</span>
              </h2>
              {p.external_id && (
                <button
                  onClick={runComps}
                  disabled={runningComps}
                  className="btn-secondary text-xs py-1"
                >
                  {runningComps ? 'Pulling...' : 'Pull Comps'}
                </button>
              )}
            </div>

            {compsAnalysis.comps.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-4 border border-dashed rounded-lg">
                {p.external_id ? 'Click Pull Comps to fetch from PropStream' : 'Requires PropStream API (needs external ID)'}
              </div>
            ) : (
              <>
                {compsAnalysis.median_price_per_sqft && (
                  <div className="mb-3 p-2 bg-brand-50 rounded-lg text-sm text-center">
                    Median <strong>${compsAnalysis.median_price_per_sqft.toFixed(0)}/sqft</strong>
                    {compsAnalysis.suggested_arv && (
                      <> → ARV <strong className="text-brand-700">{formatCurrency(compsAnalysis.suggested_arv)}</strong></>
                    )}
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500 border-b">
                        <th className="text-left pb-1">Address</th>
                        <th className="text-right pb-1">Price</th>
                        <th className="text-right pb-1">$/sqft</th>
                        <th className="text-right pb-1">Dist</th>
                        <th className="text-right pb-1">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {compsAnalysis.comps.map((c) => (
                        <tr key={c.id}>
                          <td className="py-1 truncate max-w-32 text-gray-700">{c.comp_address}</td>
                          <td className="py-1 text-right font-medium">{formatCurrency(c.sale_price)}</td>
                          <td className="py-1 text-right text-gray-600">{c.price_per_sqft ? `$${c.price_per_sqft.toFixed(0)}` : '—'}</td>
                          <td className="py-1 text-right text-gray-500">{c.distance_miles ? `${c.distance_miles.toFixed(1)}mi` : '—'}</td>
                          <td className="py-1 text-right text-gray-500">{formatDate(c.sale_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: AI Outreach */}
        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="font-semibold text-gray-900 mb-3">AI Outreach Scripts</h2>

            {/* Tab selector */}
            <div className="flex border rounded-lg overflow-hidden mb-4">
              {([['call_script', '☎ Call'], ['sms', '💬 SMS'], ['email', '✉ Email']] as [OutreachType, string][]).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => setActiveTab(type)}
                  className={`flex-1 py-1.5 text-xs font-medium transition-colors ${activeTab === type ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => generate([activeTab])}
              disabled={generatingTypes.includes(activeTab)}
              className="btn-primary w-full mb-3 text-sm"
            >
              {generatingTypes.includes(activeTab) ? 'Generating...' : `Generate ${activeTab === 'call_script' ? 'Call Script' : activeTab === 'sms' ? 'SMS Text' : 'Email'} with AI`}
            </button>

            {/* Generated content */}
            {activeTab === 'call_script' && (generated.call_script as string) && (
              <div>
                <div className="flex justify-end mb-1">
                  <button onClick={() => copy(generated.call_script as string, 'call')} className="text-xs text-gray-400 hover:text-gray-600">
                    {copiedKey === 'call' ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 max-h-96 overflow-y-auto leading-relaxed">
                  {generated.call_script as string}
                </pre>
              </div>
            )}

            {activeTab === 'sms' && (generated.sms as string) && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400">{(generated.sms as string).length}/160 chars</span>
                  <button onClick={() => copy(generated.sms as string, 'sms')} className="text-xs text-gray-400 hover:text-gray-600">
                    {copiedKey === 'sms' ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="text-sm text-gray-700 bg-green-50 rounded-lg p-3">
                  {generated.sms as string}
                </div>
              </div>
            )}

            {activeTab === 'email' && (generated.email as { subject: string; body: string }) && (
              <div>
                <div className="mb-2">
                  <div className="text-xs text-gray-500 mb-1">Subject:</div>
                  <div className="text-sm font-medium text-gray-800 bg-gray-50 rounded p-2">
                    {(generated.email as { subject: string }).subject}
                  </div>
                </div>
                <div className="flex justify-end mb-1">
                  <button
                    onClick={() => copy(`Subject: ${(generated.email as { subject: string; body: string }).subject}\n\n${(generated.email as { subject: string; body: string }).body}`, 'email')}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    {copiedKey === 'email' ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 max-h-64 overflow-y-auto leading-relaxed">
                  {(generated.email as { body: string }).body}
                </pre>
              </div>
            )}

            <button
              onClick={() => generate(['call_script', 'sms', 'email'])}
              disabled={generatingTypes.length > 0}
              className="btn-secondary w-full mt-3 text-xs"
            >
              {generatingTypes.length > 0 ? 'Generating all...' : 'Generate All 3 at Once'}
            </button>
          </div>

          {/* Outreach history */}
          {data.outreach.length > 0 && (
            <div className="card p-4">
              <h2 className="font-semibold text-gray-900 mb-3">Outreach History</h2>
              <div className="space-y-2">
                {data.outreach.slice(0, 5).map((msg) => (
                  <div key={msg.id} className="flex items-center justify-between text-xs text-gray-600 border-b pb-1 last:border-0">
                    <span className={`badge ${msg.message_type === 'call_script' ? 'bg-blue-100 text-blue-700' : msg.message_type === 'sms' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                      {msg.message_type === 'call_script' ? 'Call' : msg.message_type === 'sms' ? 'SMS' : 'Email'}
                    </span>
                    <span className={`badge ${msg.status === 'interested' ? 'bg-green-100 text-green-700' : msg.status === 'generated' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'}`}>
                      {msg.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
