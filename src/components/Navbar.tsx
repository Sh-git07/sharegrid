import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { supabase } from '../lib/supabase'
import {
  Bell,
  Grid,
  Calendar,
  Inbox,
  AlertTriangle,
  LayoutDashboard,
  Shield,
  LogOut,
  User,
  PlusCircle,
  Menu,
  X,
  Check,
} from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { DemoLoginPanel } from './DemoLoginPanel'

interface NotificationItem {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  entity_type: string | null
  entity_id: string | null
}

export function Navbar() {
  const { user, profile, roles, signOut, isOwner, isManager, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [showNotifMenu, setShowNotifMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Fetch unread notifications
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

    // Real-time subscription for notifications
    const channel = supabase
      .channel('public:notifications')
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

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur-sm shadow-2xs">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-lg bg-navy flex items-center justify-center text-white shadow-xs group-hover:bg-teal-700 transition-colors">
              <Grid className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-navy">ShareGrid</span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                PSIT Campus
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              to="/resources"
              className={`px-3 py-1.5 rounded-md transition-colors ${
                isActive('/resources') ? 'text-navy-900 bg-navy-50 font-semibold' : 'text-muted-foreground hover:text-navy hover:bg-muted/60'
              }`}
            >
              Marketplace
            </Link>

            {user && (
              <>
                <Link
                  to="/bookings"
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    isActive('/bookings') ? 'text-navy-900 bg-navy-50 font-semibold' : 'text-muted-foreground hover:text-navy hover:bg-muted/60'
                  }`}
                >
                  My Bookings
                </Link>

                {(isOwner || isManager || isAdmin) && (
                  <Link
                    to="/review"
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      isActive('/review') ? 'text-navy-900 bg-navy-50 font-semibold' : 'text-muted-foreground hover:text-navy hover:bg-muted/60'
                    }`}
                  >
                    Review Inbox
                  </Link>
                )}

                <Link
                  to="/incidents"
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    isActive('/incidents') ? 'text-navy-900 bg-navy-50 font-semibold' : 'text-muted-foreground hover:text-navy hover:bg-muted/60'
                  }`}
                >
                  Incidents
                </Link>

                <Link
                  to="/dashboard"
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    isActive('/dashboard') ? 'text-navy-900 bg-navy-50 font-semibold' : 'text-muted-foreground hover:text-navy hover:bg-muted/60'
                  }`}
                >
                  Dashboard
                </Link>

                {(isManager || isAdmin) && (
                  <Link
                    to="/admin"
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      isActive('/admin') ? 'text-navy-900 bg-navy-50 font-semibold' : 'text-muted-foreground hover:text-navy hover:bg-muted/60'
                    }`}
                  >
                    Admin & Queue
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>

        {/* Right Section: Actions & Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Switcher */}
          <div className="hidden lg:block">
            <DemoLoginPanel compact />
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              {/* List Resource Button for Owners/Admin */}
              {(isOwner || isAdmin) && (
                <Button
                  onClick={() => navigate('/owner/resources/new')}
                  size="sm"
                  className="hidden sm:inline-flex bg-navy hover:bg-navy-800 text-xs font-semibold gap-1.5 shadow-2xs"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> List Resource
                </Button>
              )}

              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className="relative p-2 rounded-lg text-muted-foreground hover:text-navy hover:bg-muted/60 transition-colors focus:outline-none"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border bg-card p-3 shadow-lg z-50 animate-in fade-in-50">
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

              {/* Profile Link & Logout */}
              <Link
                to="/profile"
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
                title="Profile"
              >
                <div className="h-8 w-8 rounded-full bg-navy-100 border border-navy-200 flex items-center justify-center text-xs font-bold text-navy-800">
                  {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left text-xs leading-tight">
                  <p className="font-semibold text-navy">{profile?.full_name || 'My Account'}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{roles[0] || 'REQUESTER'}</p>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 text-muted-foreground hover:text-rose-600 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-navy hover:bg-navy-800">
                  Register
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-navy rounded-lg"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background p-4 space-y-3">
          <DemoLoginPanel compact />
          <nav className="flex flex-col space-y-2 text-sm pt-2">
            <Link
              to="/resources"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-md hover:bg-muted"
            >
              Marketplace
            </Link>
            {user && (
              <>
                <Link
                  to="/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-md hover:bg-muted"
                >
                  My Bookings
                </Link>
                {(isOwner || isManager || isAdmin) && (
                  <Link
                    to="/review"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-md hover:bg-muted"
                  >
                    Review Inbox
                  </Link>
                )}
                <Link
                  to="/incidents"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-md hover:bg-muted"
                >
                  Incidents
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-md hover:bg-muted"
                >
                  Dashboard
                </Link>
                {(isManager || isAdmin) && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-md hover:bg-muted"
                  >
                    Admin & Queue
                  </Link>
                )}
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-md hover:bg-muted"
                >
                  Profile & Certifications
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
