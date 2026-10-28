import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined, fmt = 'PPP'): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '—'
  return format(d, fmt)
}

export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'PPp')
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '—'
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours === Math.floor(hours)) return `${hours}h`
  return `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    CHECKED_IN: 'bg-blue-100 text-blue-800',
    RETURN_PENDING_INSPECTION: 'bg-orange-100 text-orange-800',
    COMPLETED: 'bg-teal-100 text-teal-800',
    REJECTED: 'bg-red-100 text-red-800',
    WAITLISTED: 'bg-purple-100 text-purple-800',
    CANCELLED: 'bg-gray-100 text-gray-600',
    OVERDUE: 'bg-red-100 text-red-800',
    INCIDENT_REPORTED: 'bg-red-200 text-red-900',
    PUBLISHED: 'bg-green-100 text-green-800',
    RESTRICTED: 'bg-yellow-100 text-yellow-800',
    MAINTENANCE: 'bg-orange-100 text-orange-800',
    ARCHIVED: 'bg-gray-100 text-gray-600',
    AVAILABLE: 'bg-green-100 text-green-800',
    VERIFIED: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    UNVERIFIED: 'bg-gray-100 text-gray-700',
    OPEN: 'bg-red-100 text-red-800',
    UNDER_REVIEW: 'bg-blue-100 text-blue-800',
    AWAITING_INFORMATION: 'bg-yellow-100 text-yellow-800',
    RESOLVED: 'bg-green-100 text-green-800',
    DISMISSED: 'bg-gray-100 text-gray-600',
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
  }
  return map[status] ?? 'bg-gray-100 text-gray-700'
}

export function humanizeStatus(status: string): string {
  const map: Record<string, string> = {
    PENDING_APPROVAL: 'Pending Approval',
    CHECKED_IN: 'Checked In',
    RETURN_PENDING_INSPECTION: 'Return Pending',
    INCIDENT_REPORTED: 'Incident Reported',
    RESOURCE_OWNER: 'Resource Owner',
    UNDER_REVIEW: 'Under Review',
    AWAITING_INFORMATION: 'Awaiting Info',
  }
  return map[status] ?? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}
