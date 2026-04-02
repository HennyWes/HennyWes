import Link from 'next/link'
import { getDashboardStats, getPipelineByStatus } from '@/lib/db/queries/properties'
import { getRecentActivity } from '@/lib/db/queries/outreach'
import { formatCurrency, formatRelativeDate, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/format'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const stats = getDashboardStats()
  const pipeline = getPipelineByStatus()
  const activity = getRecentActivity(8)
  const total = stats.total || 1

  const STAT_CARDS = [
    { label: 'Total Leads', value: stats.total, color: 'border-blue-400', sub: 'in pipeline' },
    { label: 'Skip Traced', value: stats.skip_traced, color: 'border-purple-400', sub: 'have contact info' },
    { label: 'Contacted', value: stats.contacted, color: 'border-yellow-400', sub: 'outreach sent' },
    { label: 'Interested', value: stats.interested, color: 'border-green-400', sub: 'potential deals' },
  ]

  const PIPELINE_ORDER = ['new', 'skip_traced', 'contacted', 'negotiating', 'under_contract', 'dead', 'dnc']

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/import" className="btn-primary">Import CSV</Link>
          <Link href="/search" className="btn-secondary">Search PropStream</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className={`card p-4 border-l-4 ${s.color}`}>
            <div className="text-3xl font-bold text-gray-900">{s.value.toLocaleString()}</div>
            <div className="text-sm font-medium text-gray-700 mt-1">{s.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Pipeline by Status</h2>
          <div className="space-y-3">
            {PIPELINE_ORDER.map((status) => {
              const count = pipeline[status] ?? 0
              const pct = Math.round((count / total) * 100)
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={`badge ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
                    <span className="font-medium text-gray-700">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div
                      className="h-2 bg-brand-500 rounded-full transition-all"
                      style={{ width: `${Math.max(pct, count > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {activity.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No outreach yet.{' '}
              <Link href="/properties" className="text-brand-600 underline">
                Open a lead
              </Link>{' '}
              to generate your first script.
            </div>
          ) : (
            <div className="space-y-3">
              {activity.map((item) => (
                <Link
                  key={item.id}
                  href={`/properties/${item.property_id}`}
                  className="flex items-start gap-3 hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                >
                  <div className={`badge mt-0.5 shrink-0 ${
                    item.message_type === 'call_script' ? 'bg-blue-100 text-blue-700' :
                    item.message_type === 'sms' ? 'bg-green-100 text-green-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {item.message_type === 'call_script' ? 'Call' : item.message_type === 'sms' ? 'SMS' : 'Email'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-800 truncate">{item.property_address}</div>
                    <div className="text-xs text-gray-400">{formatRelativeDate(item.created_at)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      {stats.total === 0 && (
        <div className="card p-6 text-center border-dashed border-2">
          <div className="text-gray-500 mb-4">Get started by importing your PropStream leads</div>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/import" className="btn-primary">Import PropStream CSV</Link>
            <Link href="/search" className="btn-secondary">Search PropStream API</Link>
            <Link href="/settings" className="btn-ghost">Configure Settings</Link>
          </div>
        </div>
      )}
    </div>
  )
}
