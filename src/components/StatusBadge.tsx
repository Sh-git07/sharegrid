import React from 'react'
import { Badge } from './ui/badge'
import { CheckCircle2, Clock, AlertTriangle, XCircle, ShieldAlert, AlertCircle, Ban } from 'lucide-react'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  switch (status) {
    case 'AVAILABLE':
      return (
        <Badge variant="success" className={className}>
          <CheckCircle2 className="mr-1 h-3 w-3" /> Available
        </Badge>
      )
    case 'RESTRICTED':
      return (
        <Badge variant="warning" className={className}>
          <AlertCircle className="mr-1 h-3 w-3" /> Training Required
        </Badge>
      )
    case 'MAINTENANCE':
      return (
        <Badge variant="warning" className={className}>
          <Clock className="mr-1 h-3 w-3" /> In Maintenance
        </Badge>
      )
    case 'UNAVAILABLE':
      return (
        <Badge variant="destructive" className={className}>
          <Ban className="mr-1 h-3 w-3" /> Unavailable
        </Badge>
      )
    case 'PENDING_APPROVAL':
      return (
        <Badge variant="warning" className={className}>
          <Clock className="mr-1 h-3 w-3" /> Pending Review
        </Badge>
      )
    case 'APPROVED':
      return (
        <Badge variant="info" className={className}>
          <CheckCircle2 className="mr-1 h-3 w-3" /> Approved
        </Badge>
      )
    case 'CHECKED_IN':
      return (
        <Badge variant="teal" className={className}>
          <Clock className="mr-1 h-3 w-3" /> Checked In
        </Badge>
      )
    case 'RETURN_PENDING_INSPECTION':
      return (
        <Badge variant="warning" className={className}>
          <Clock className="mr-1 h-3 w-3" /> Returned (Pending Inspection)
        </Badge>
      )
    case 'COMPLETED':
      return (
        <Badge variant="success" className={className}>
          <CheckCircle2 className="mr-1 h-3 w-3" /> Completed
        </Badge>
      )
    case 'REJECTED':
      return (
        <Badge variant="destructive" className={className}>
          <XCircle className="mr-1 h-3 w-3" /> Rejected
        </Badge>
      )
    case 'WAITLISTED':
      return (
        <Badge variant="secondary" className={className}>
          <Clock className="mr-1 h-3 w-3" /> Waitlisted
        </Badge>
      )
    case 'CANCELLED':
      return (
        <Badge variant="outline" className={className}>
          <XCircle className="mr-1 h-3 w-3" /> Cancelled
        </Badge>
      )
    case 'OVERDUE':
      return (
        <Badge variant="destructive" className={className}>
          <AlertTriangle className="mr-1 h-3 w-3" /> Overdue
        </Badge>
      )
    case 'INCIDENT_REPORTED':
      return (
        <Badge variant="destructive" className={className}>
          <ShieldAlert className="mr-1 h-3 w-3" /> Incident Reported
        </Badge>
      )
    default:
      return <Badge variant="outline" className={className}>{status}</Badge>
  }
}
