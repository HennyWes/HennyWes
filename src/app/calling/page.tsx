'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { formatPhone, formatCurrency, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/format'
import type { Property, PropertyStatus } from '@/types/property'
import type { Contact } from '@/types/contact'
import type { OutreachMessage, OutreachType } from '@/types/outreach'

interface PropertyDetail {
  property: Property
  contacts: Contact[]
  outreach: OutreachMessage[]
}

const DISPOSITIONS: Array<{ label: string; status: OutreachStatus; color: string }> = [
  { label: 'No Answer', status: 'no_answer', color: 'btn-secondary' },
  { label: 'Left VM', status: 'left_vm', color: 'btn-secondary' },
  { label: 'Not Interested', status: 'not_interested', color: 'btn-danger' },
  { label: 'Interested!', status: 'interested', color: 'btn-primary' },
  { label: 'DNC', status: 'dnc', color: 'btn-danger' },
]

type OutreachStatus = 'no_answer' | 'left_vm' | 'not_interested' | 'interested' | 'dnc'

function CallingPageInner() {
  const searchParams = useSearchParams()
  const initId = searchParams.get('id')

  const [leads, setLeads] = useState<Property[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [detail, setDetail] = useState<PropertyDetail | null>(null)
  const [script, setScript] = useState('')
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLeads() {
      const res = await fetch('/api/properties?status=skip_traced&limit=100')
      const data = await res.json()
      let props: Property[] = data.properties ?? []

      if (initId) {
        const targetIdx = props.findIndex((p) => String(p.id) === initId)
        if (targetIdx >= 0) setCurrentIdx(targetIdx)
        else {
          // Load the specific property and put it first
          const pRes = await fetch(`/api/properties/${initId}`)
          if (pRes.ok) {
            const pd = await pRes.json()
            props = [pd.property, ...props]
          }
        }
      }

      setLeads(props)
      setLoading(false)
    }
    loadLeads()
  }, [initId])

  const currentProperty = leads[currentIdx]

  useEffect(() => {
    if (!currentProperty) return
    fetch(`/api/properties/${currentProperty.id}`)
      .then((r) => r.json())
      .then(setDetail)
  }, [currentProperty])

  useEffect(() => {
    if (!detail) return
    const callScript = detail.outreach.find((o) => o.message_type === 'call_script')
    setScript(callScript?.body ?? '')
  }, [detail])

  async function generateScript() {
    if (!currentProperty) return
    setGenerating(true)
    const res = await fetch(`/api/properties/${currentProperty.id}/outreach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ types: ['call_script'] }),
    })
    const d = await res.json()
    if (d.call_script) setScript(d.call_script)
    setGenerating(false)
  }

  async function logDisposition(status: OutreachStatus) {
    if (!detail) return
    const latestScript = detail.outreach.find((o) => o.message_type === 'call_script')
    if (latestScript) {
      await fetch(`/api/outreach/${latestScript.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    }

    const newStatus: PropertyStatus =
      status === 'interested' ? 'negotiating' :
      status === 'dnc' ? 'dnc' :
      status === 'not_interested' ? 'dead' : 'contacted'

    await fetch(`/api/properties/${currentProperty.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })

    // Advance to next
    if (currentIdx < leads.length - 1) {
      setCurrentIdx((i) => i + 1)
      setDetail(null)
      setScript('')
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Loading leads...</div>

  if (leads.length === 0) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold mb-2">No leads to call</h1>
        <p className="text-gray-500 mb-4">Skip trace your leads first to get phone numbers.</p>
        <Link href="/properties" className="btn-primary">Go to My Leads</Link>
      </div>
    )
  }

  const phones = detail?.contacts.flatMap((c) => c.phones?.filter((p) => !p.do_not_call) ?? []) ?? []
  const primaryPhone = phones[0]

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Calling Mode</h1>
        <div className="text-sm text-gray-500">
          {currentIdx + 1} / {leads.length} leads
        </div>
      </div>

      {currentProperty && (
        <div className="space-y-4">
          {/* Main calling card */}
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-lg font-bold text-gray-900">{currentProperty.owner_name ?? 'Unknown Owner'}</div>
                <div className="text-gray-500">{currentProperty.address}, {currentProperty.city}, {currentProperty.state}</div>
                <div className="mt-1 text-sm">
                  {formatCurrency(currentProperty.estimated_value)} est. value
                  {currentProperty.equity_percent != null && ` · ${currentProperty.equity_percent.toFixed(0)}% equity`}
                </div>
              </div>
              <span className={`badge ${STATUS_COLORS[currentProperty.status]}`}>{STATUS_LABELS[currentProperty.status]}</span>
            </div>

            {/* Big phone display */}
            {primaryPhone ? (
              <div className="text-center py-6 bg-green-50 rounded-xl mb-4">
                <a
                  href={`tel:${primaryPhone.phone}`}
                  className="text-4xl lg:text-5xl font-mono font-bold text-gray-900 hover:text-brand-600 transition-colors"
                >
                  {formatPhone(primaryPhone.phone)}
                </a>
                {primaryPhone.phone_type && (
                  <div className="text-sm text-gray-500 mt-1">{primaryPhone.phone_type}</div>
                )}
                <div className="text-xs text-gray-400 mt-1">Tap to call</div>
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-xl mb-4 text-gray-400">
                No phone — <Link href={`/properties/${currentProperty.id}`} className="text-brand-600">skip trace first</Link>
              </div>
            )}

            {/* Additional phones */}
            {phones.length > 1 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {phones.slice(1).map((ph) => (
                  <a key={ph.id} href={`tel:${ph.phone}`} className="badge bg-gray-100 text-gray-700 hover:bg-gray-200 font-mono">
                    {formatPhone(ph.phone)}
                  </a>
                ))}
              </div>
            )}

            {/* Disposition buttons */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
              {DISPOSITIONS.map((d) => (
                <button
                  key={d.status}
                  onClick={() => logDisposition(d.status)}
                  className={`${d.color} text-xs py-2`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Call script */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Call Script</h2>
              <button onClick={generateScript} disabled={generating} className="btn-secondary text-xs py-1">
                {generating ? 'Generating...' : script ? 'Regenerate' : 'Generate AI Script'}
              </button>
            </div>
            {script ? (
              <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4 max-h-72 overflow-y-auto">
                {script}
              </pre>
            ) : (
              <div className="text-center py-6 text-gray-400 text-sm">
                Click "Generate AI Script" to get a personalized call script
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              disabled={currentIdx === 0}
              onClick={() => { setCurrentIdx((i) => i - 1); setDetail(null); setScript('') }}
              className="btn-secondary"
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-500">{currentIdx + 1} of {leads.length}</span>
            <button
              disabled={currentIdx === leads.length - 1}
              onClick={() => { setCurrentIdx((i) => i + 1); setDetail(null); setScript('') }}
              className="btn-secondary"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CallingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
      <CallingPageInner />
    </Suspense>
  )
}
