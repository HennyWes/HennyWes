'use client'
import { useState, useEffect } from 'react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    propstream_email: '',
    propstream_password: '',
    investor_name: '',
    investor_company: '',
    investor_phone: '',
    groq_model: 'llama-3.3-70b-versatile',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')
  const [propstreamConnected, setPropstreamConnected] = useState(false)

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then((d) => {
      setSettings((s) => ({
        ...s,
        propstream_email: d.propstream_email ?? '',
        investor_name: d.investor_name ?? '',
        investor_company: d.investor_company ?? '',
        investor_phone: d.investor_phone ?? '',
        groq_model: d.groq_model ?? 'llama-3.3-70b-versatile',
      }))
      setPropstreamConnected(!!d.propstream_token)
      setLoading(false)
    })
  }, [])

  async function save() {
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) { setMsg('Settings saved'); setMsgType('success') }
      else throw new Error('Failed to save')
    } catch {
      setMsg('Error saving settings'); setMsgType('error')
    } finally {
      setSaving(false)
    }
  }

  async function testPropstream() {
    if (!settings.propstream_email || !settings.propstream_password) {
      setMsg('Enter email and password first'); setMsgType('error'); return
    }
    setTesting(true)
    setMsg('')
    try {
      const res = await fetch('/api/propstream/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: settings.propstream_email, password: settings.propstream_password }),
      })
      const data = await res.json()
      if (res.ok) { setMsg('PropStream connected successfully!'); setMsgType('success'); setPropstreamConnected(true) }
      else { setMsg(data.error ?? 'Connection failed'); setMsgType('error') }
    } finally {
      setTesting(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {msg && (
        <div className={`card p-3 text-sm ${msgType === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg}
        </div>
      )}

      {/* Investor Profile */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-1">Your Investor Profile</h2>
        <p className="text-sm text-gray-500 mb-4">Used in AI-generated scripts so they sound personalized.</p>
        <div className="space-y-3">
          {[
            { key: 'investor_name', label: 'Your Name', placeholder: 'John Smith' },
            { key: 'investor_company', label: 'Company Name', placeholder: 'Quick Close Properties LLC' },
            { key: 'investor_phone', label: 'Your Phone', placeholder: '(555) 123-4567' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
              <input
                className="input"
                placeholder={placeholder}
                value={settings[key as keyof typeof settings]}
                onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Groq AI */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-1">Groq AI (Free)</h2>
        <p className="text-sm text-gray-500 mb-3">
          Powers your AI outreach scripts.{' '}
          <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
            Get a free API key at console.groq.com →
          </a>
        </p>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">API Key (GROQ_API_KEY)</label>
          <input
            className="input font-mono text-sm"
            placeholder="gsk_..."
            type="text"
            readOnly
            value={process.env.NEXT_PUBLIC_GROQ_CONFIGURED === 'true' ? '••••••••' : 'Add GROQ_API_KEY to .env.local'}
          />
          <p className="text-xs text-gray-500 mt-1">Add to your <code className="bg-gray-100 px-1 rounded">.env.local</code> file: <code className="bg-gray-100 px-1 rounded">GROQ_API_KEY=gsk_...</code></p>
        </div>
      </div>

      {/* PropStream */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="font-semibold text-gray-900">PropStream API</h2>
          {propstreamConnected && <span className="badge bg-green-100 text-green-700">Connected</span>}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          For live search and comps. If you don't have API access,{' '}
          <a href="/import" className="text-brand-600 underline">use CSV import instead</a>.
          Skip tracing is handled FREE via TruePeopleSearch — no PropStream skip trace charges.
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">PropStream Email</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={settings.propstream_email}
              onChange={(e) => setSettings((s) => ({ ...s, propstream_email: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">PropStream Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={settings.propstream_password}
              onChange={(e) => setSettings((s) => ({ ...s, propstream_password: e.target.value }))}
            />
          </div>
          <button onClick={testPropstream} disabled={testing} className="btn-secondary">
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
      </div>

      {/* Skip Trace Info */}
      <div className="card p-5 bg-blue-50 border-blue-200">
        <h2 className="font-semibold text-blue-900 mb-2">Skip Tracing — 100% Free</h2>
        <p className="text-sm text-blue-800">
          PropReach AI skip traces owner contact info using <strong>TruePeopleSearch.com</strong> and <strong>lookup.io</strong> —
          both completely free. No charges to your PropStream account.
          Click "Skip Trace FREE" on any property to find phone numbers.
        </p>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary w-full">
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  )
}
