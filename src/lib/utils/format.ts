export function formatCurrency(val: number | null | undefined): string {
  if (val == null) return 'N/A'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
}

export function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, '')
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  if (d.length === 11 && d[0] === '1') return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`
  return digits
}

export function formatDate(val: string | null | undefined): string {
  if (!val) return 'N/A'
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatRelativeDate(unixSeconds: number): string {
  const diff = Date.now() / 1000 - unixSeconds
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(unixSeconds * 1000).toLocaleDateString()
}

export const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  skip_traced: 'Skip Traced',
  contacted: 'Contacted',
  negotiating: 'Negotiating',
  under_contract: 'Under Contract',
  dead: 'Dead',
  dnc: 'DNC',
}

export const STATUS_COLORS: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700',
  skip_traced: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  negotiating: 'bg-orange-100 text-orange-700',
  under_contract: 'bg-green-100 text-green-700',
  dead: 'bg-red-100 text-red-700',
  dnc: 'bg-red-200 text-red-800',
}
