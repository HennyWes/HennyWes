'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '■' },
  { href: '/search', label: 'Search PropStream', icon: '◎' },
  { href: '/import', label: 'Import CSV', icon: '↑' },
  { href: '/properties', label: 'My Leads', icon: '⊞' },
  { href: '/campaigns', label: 'Campaigns', icon: '◈' },
  { href: '/calling', label: 'Calling Mode', icon: '☎' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-gray-900 text-white h-screen">
      <div className="px-4 py-5 border-b border-gray-700">
        <span className="text-lg font-bold text-brand-400">PropReach</span>
        <span className="text-lg font-bold text-white"> AI</span>
      </div>
      <nav className="flex-1 py-4 space-y-0.5 px-2">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              path === item.href || path.startsWith(item.href + '/')
                ? 'bg-brand-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            )}
          >
            <span className="text-base leading-none">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-gray-700 text-xs text-gray-500">
        Free skip trace via TruePeopleSearch
      </div>
    </aside>
  )
}
