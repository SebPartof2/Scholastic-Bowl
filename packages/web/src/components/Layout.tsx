import { NavLink, useLocation } from 'react-router-dom'
import { ReactNode, useState } from 'react'

const mainNav = [
  { to: '/rankings', label: 'Rankings' },
  { to: '/teams', label: 'Teams' },
  { to: '/matchup', label: 'Matchup' },
]

const adminNav = [
  { to: '/admin/enter', label: 'Enter Results' },
  { to: '/admin/scrape', label: 'Scrape' },
  { to: '/admin/seasons', label: 'Seasons' },
]

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-accent-600/90 text-white shadow-md shadow-accent-600/20'
            : 'text-gray-400 hover:text-white hover:bg-gray-800/80'
        }`
      }
    >
      {label}
    </NavLink>
  )
}

export default function Layout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <NavLink to="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-accent-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-accent-600/30">
                SB
              </div>
              <span className="text-lg font-bold text-white hidden sm:block">
                Scholastic Bowl
              </span>
            </NavLink>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {mainNav.map(item => (
                <NavItem key={item.to} {...item} />
              ))}
              <div className="w-px h-5 bg-gray-800 mx-2" />
              {adminNav.map(item => (
                <NavItem key={item.to} {...item} />
              ))}
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-800/60 animate-fade-in">
            <div className="px-4 py-3 space-y-1">
              {mainNav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                    location.pathname === item.to
                      ? 'bg-accent-600/90 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/80'
                  }`}
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="border-t border-gray-800/60 my-2" />
              <p className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</p>
              {adminNav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                    location.pathname === item.to
                      ? 'bg-accent-600/90 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/80'
                  }`}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
