'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'

interface PreviewData {
  totalRows: number
  validRows: number
  detectedColumns: Record<string, string>
  unmatchedHeaders: string[]
  sampleRows: Record<string, string>[]
}

interface ImportResult {
  imported: number
  skipped: number
  batch_id: string
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(f: File) {
    setFile(f)
    setPreview(null)
    setResult(null)
    setError('')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', f)
      fd.append('preview', 'true')
      const res = await fetch('/api/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPreview(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleImport() {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && f.name.endsWith('.csv')) handleFileChange(f)
  }

  if (result) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="card p-8 text-center">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Import Complete</h2>
          <p className="text-gray-600 mb-1">
            <strong>{result.imported}</strong> properties imported
          </p>
          {result.skipped > 0 && (
            <p className="text-gray-500 text-sm mb-4">{result.skipped} skipped (duplicates or missing address)</p>
          )}
          <div className="flex gap-3 justify-center mt-6">
            <Link href="/properties" className="btn-primary">View My Leads</Link>
            <button onClick={() => { setFile(null); setPreview(null); setResult(null) }} className="btn-secondary">
              Import Another File
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import from PropStream</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Export your leads from PropStream as a CSV, then upload here.
          Phones from skip-traced exports are imported automatically.
        </p>
      </div>

      {/* Drop zone */}
      {!file && (
        <div
          className="card border-dashed border-2 border-gray-300 p-12 text-center cursor-pointer hover:border-brand-400 transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <div className="text-4xl mb-3">↑</div>
          <div className="text-gray-700 font-medium">Drag &amp; drop your PropStream CSV here</div>
          <div className="text-gray-400 text-sm mt-1">or click to browse</div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
          />
        </div>
      )}

      {loading && (
        <div className="card p-6 text-center text-gray-500">Processing CSV...</div>
      )}

      {error && (
        <div className="card p-4 bg-red-50 border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Preview: {file?.name}</h2>
              <button onClick={() => { setFile(null); setPreview(null) }} className="btn-ghost text-xs">
                Change file
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{preview.totalRows}</div>
                <div className="text-gray-500">Total rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-600">{preview.validRows}</div>
                <div className="text-gray-500">Valid properties</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-500">{Object.keys(preview.detectedColumns).length}</div>
                <div className="text-gray-500">Columns matched</div>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-sm font-medium text-gray-700 mb-2">Detected columns:</div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(preview.detectedColumns).map(([col, mapped]) => (
                  <span key={col} className="badge bg-green-100 text-green-700">
                    ✓ {col}
                  </span>
                ))}
                {preview.unmatchedHeaders.map((h) => (
                  <span key={h} className="badge bg-gray-100 text-gray-500">
                    {h}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sample rows */}
          {preview.sampleRows.length > 0 && (
            <div className="card overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    {Object.keys(preview.sampleRows[0]).slice(0, 6).map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-gray-600 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.sampleRows.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      {Object.values(row).slice(0, 6).map((val, j) => (
                        <td key={j} className="px-3 py-2 text-gray-700 max-w-32 truncate">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={handleImport} disabled={loading} className="btn-primary">
              {loading ? 'Importing...' : `Import ${preview.validRows} Properties`}
            </button>
            <button onClick={() => { setFile(null); setPreview(null) }} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="card p-4 bg-blue-50 border-blue-200 text-sm text-blue-800">
        <strong>Tip:</strong> Export from PropStream by running your filter, then clicking Export → CSV.
        For skip traced exports (with phone numbers), the phones will import automatically.
        For non-skip-traced exports, use the Skip Trace button on each lead to get phones free via TruePeopleSearch.
      </div>
    </div>
  )
}
