import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { supabase } from '../lib/supabase'
import { DemoLoginPanel } from './DemoLoginPanel'
import { Footer } from './Footer'
import { Button } from './ui/button'
import {
  Grid,
  Calendar,
  Inbox,
  AlertTriangle,
  LayoutDashboard,
  Shield,
  User,
  PlusCircle,
  LogOut,
  Bell,
  Check,
  ChevronRight,
} from 'lucide-react'

interface NotificationItem {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

interface AppShellProps {
  children: React.ReactNode
}

interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

export function AppShell({ children }: AppShellProps) {
  const { user, profile, roles, loading, signOut, isOwner, isManager, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [showNotifMenu, setShowNotifMenu] = useState(false)

  // Fetch notifications for logged-in user
  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      setNotifications([])
      return
    }

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (data) {
        setNotifications(data as NotificationItem[])
        setUnreadCount(data.filter((n) => !n.is_read).length)
      }
    }

    fetchNotifications()

    const channel = supabase
      .channel(`public:notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as NotificationItem, ...prev.slice(0, 9)])
          setUnreadCount((c) => c + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const markAllRead = async () => {
    if (!user) return
    await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', user.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  // Determine primary active role with deterministic priority
  const primaryRole = roles.includes('ADMIN')
    ? 'ADMIN'
    : roles.includes('MANAGER')
    ? 'MANAGER'
    : roles.includes('RESOURCE_OWNER')
    ? 'RESOURCE_OWNER'
    : 'REQUESTER'

  const formatRoleTitle = (role: string) => {
    switch (role) {
      case 'RESOURCE_OWNER':
        return 'Resource Owner'
      case 'MANAGER':
        return 'Facility Manager'
      case 'ADMIN':
        return 'Campus Admin'
      default:
        return 'Requester'
    }
  }

  // Navigation items strictly per role
  const navItems: NavItem[] = [
    { label: 'Marketplace', path: '/resources', icon: Grid },
    { label: 'My Bookings', path: '/bookings', icon: Calendar },
  ]

  if (isOwner || isManager || isAdmin) {
    navItems.push({ label: 'Review Inbox', path: '/review', icon: Inbox })
  }

  if (isOwner || isAdmin) {
    navItems.push({ label: 'List Resource', path: '/owner/resources/new', icon: PlusCircle })
  }

  if (isManager || isAdmin) {
    navItems.push({ label: 'Admin & Queue', path: '/admin', icon: Shield })
  }

  navItems.push(
    { label: 'Incidents', path: '/incidents', icon: AlertTriangle },
    { label: 'Analytics Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Profile & Safety', path: '/profile', icon: User }
  )

  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  const showSidebar = Boolean(user || isDemoMode)

  return (
    <div className="min-h-screen flex flex-col bg-cream" data-testid="app-shell">
      {/* 2. Top Header: fixed height (h-16), fixed layout (flex items-center justify-between), identical for every role */}
      <header
        className="sticky top-0 z-40 w-full border-b border-border bg-white/95 backdrop-blur-sm shadow-2xs h-16 shrink-0 flex items-center"
        data-testid="app-header"
      >
        <div className="w-full px-4 sm:px-8 flex items-center justify-between max-w-7xl mx-auto">
          {/* Brand - Left slot */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="h-9 w-9 rounded-lg bg-navy flex items-center justify-center text-white shadow-xs group-hover:bg-teal-700 transition-colors">
                <Grid className="h-5 w-5" />
              </div>
              <div className="flex items-center">
                <span className="text-xl font-bold tracking-tight text-navy">ShareGrid</span>
                <span className="hidden sm:inline-block ml-2 text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 whitespace-nowrap">
                  Shikha's Organisation
                </span>
              </div>
            </Link>
          </div>

          {/* Right-side items: Fixed positions for every role. Only label text changes inside fixed-width slot (w-40 truncate) */}
          <div className="flex items-center gap-3 shrink-0">
            {user || isDemoMode ? (
              <>
                {/* Fixed Demo Switcher Slot */}
                <div className="shrink-0 min-w-[280px]">
                  <DemoLoginPanel compact />
                </div>

                {/* Fixed Role Badge Slot (w-40 truncate) */}
                <div className="w-40 shrink-0 flex items-center justify-end">
                  <span
                    className="w-40 truncate text-xs font-semibold px-2.5 py-1 rounded-full bg-navy-50 text-navy border border-navy-200 text-center"
                    title={formatRoleTitle(primaryRole)}
                  >
                    {formatRoleTitle(primaryRole)}
                  </span>
                </div>

                {/* Fixed Notification Bell Slot with Absolute Overlay Badge */}
                <div className="w-9 h-9 shrink-0 relative flex items-center justify-center">
                  <button
                    onClick={() => setShowNotifMenu(!showNotifMenu)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-navy hover:bg-muted/60 transition-colors focus:outline-none"
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                  </button>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white pointer-events-none">
                      {unreadCount}
                    </span>
                  )}

                  {showNotifMenu && (
                    <div className="absolute right-0 top-10 w-80 sm:w-96 rounded-xl border bg-card p-3 shadow-lg z-50 animate-in fade-in-50">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                        <span className="text-sm font-semibold text-navy">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-xs text-teal-700 hover:underline flex items-center gap-1"
                          >
                            <Check className="h-3 w-3" /> Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto space-y-2">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-6">No notifications yet</p>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`p-2.5 rounded-lg text-xs transition-colors ${
                                n.is_read ? 'bg-muted/30 text-muted-foreground' : 'bg-navy-50/70 text-navy font-medium'
                              }`}
                            >
                              <p className="font-semibold">{n.title}</p>
                              <p className="mt-0.5 text-[11px] leading-relaxed">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Fixed User Menu Slot with Truncate */}
                <div className="w-36 shrink-0 flex items-center gap-2 justify-end">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted/60 transition-colors"
                    title={profile?.full_name || user?.email || 'Profile'}
                  >
                    <div className="h-8 w-8 rounded-full bg-navy-100 border border-navy-200 flex items-center justify-center text-xs font-bold text-navy-800 shrink-0">
                      {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="truncate max-w-[84px] text-xs font-medium text-navy hidden md:inline-block">
                      {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Member'}
                    </span>
                  </Link>
                </div>

                {/* Fixed Logout Button Slot */}
                <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <Link to="/resources" className="text-xs font-semibold text-muted-foreground hover:text-navy px-3 py-1.5">
                  Marketplace
                </Link>
                <Link to="/login">
                  <Button size="sm" variant="outline" className="text-xs">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-navy hover:bg-navy-800 text-xs">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Shell Container */}
      <div className="flex flex-1 min-h-0">
        {/* 3. Fixed Width Sidebar (w-64 shrink-0), always renders immediately with the same size */}
        {showSidebar && (
          <aside
            className="w-64 shrink-0 border-r border-border bg-white flex flex-col justify-between"
            data-testid="app-sidebar"
          >
            <div className="p-4 space-y-4">
              {/* Active Role Card - Stable Height */}
              <div className="px-3.5 py-3 rounded-xl bg-navy-50/80 border border-navy-100 h-[68px] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Active Session
                  </span>
                  <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                </div>
                <p className="text-xs font-bold text-navy truncate">{formatRoleTitle(primaryRole)}</p>
                <p className="text-[11px] text-muted-foreground truncate">{profile?.full_name || user?.email || 'Loading session...'}</p>
              </div>

              {/* Navigation Items (Role-specific, uniform h-10 height for every role) */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const active =
                    location.pathname === item.path ||
                    (item.path !== '/' && location.pathname.startsWith(item.path + '/'))
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`h-10 flex items-center justify-between px-3 rounded-lg text-xs font-semibold transition-colors ${
                        active
                          ? 'bg-navy text-white shadow-2xs'
                          : 'text-muted-foreground hover:text-navy hover:bg-navy-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 ${active ? 'text-teal-300' : 'text-muted-foreground'}`} />
                        <span>{item.label}</span>
                      </div>
                      {active && <ChevronRight className="h-3 w-3 text-teal-300" />}
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Sidebar Bottom: Tenant Badge - Stable Height */}
            <div className="p-4 border-t border-border bg-muted/20 h-16 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-navy">Tenant</span>
                <span className="text-[10px] bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">Shikha's Organisation</p>
            </div>
          </aside>
        )}

        {/* Main Content Area (min-w-0 flex-1). Skeletons render ONLY inside the content area. */}
        <main className="min-w-0 flex-1 flex flex-col bg-cream" data-testid="app-main">
          <div className="flex-1">
            {loading && !user ? (
              <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6 animate-pulse">
                <div className="h-14 bg-muted/60 rounded-xl" />
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-28 bg-muted/40 rounded-xl" />
                  ))}
                </div>
                <div className="h-64 bg-muted/30 rounded-xl" />
              </div>
            ) : (
              children
            )}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}
