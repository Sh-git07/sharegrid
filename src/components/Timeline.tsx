import React from 'react'
import { CheckCircle2, Clock, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react'
import { cn } from '../lib/utils'
import { formatDateTime } from '../lib/dates'

export interface TimelineStep {
  title: string
  timestamp?: string | null
  description?: string
  status: 'completed' | 'current' | 'upcoming' | 'failed'
}

interface TimelineProps {
  steps: TimelineStep[]
  className?: string
}

export function Timeline({ steps, className }: TimelineProps) {
  return (
    <div className={cn('relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border', className)}>
      {steps.map((step, idx) => {
        const isCompleted = step.status === 'completed'
        const isCurrent = step.status === 'current'
        const isFailed = step.status === 'failed'

        return (
          <div key={idx} className="relative group">
            {/* Indicator Icon */}
            <div
              className={cn(
                'absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full border bg-background text-xs shadow-xs',
                isCompleted && 'border-emerald-500 bg-emerald-50 text-emerald-600',
                isCurrent && 'border-navy-600 bg-navy-50 text-navy-700 ring-4 ring-navy-100',
                isFailed && 'border-rose-500 bg-rose-50 text-rose-600',
                step.status === 'upcoming' && 'border-border text-muted-foreground'
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : isFailed ? (
                <XCircle className="h-3.5 w-3.5" />
              ) : isCurrent ? (
                <Clock className="h-3.5 w-3.5 animate-pulse" />
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-border" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p
                  className={cn(
                    'text-sm font-semibold',
                    isCurrent && 'text-navy-900',
                    isCompleted && 'text-emerald-900',
                    isFailed && 'text-rose-900',
                    step.status === 'upcoming' && 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </p>
                {step.timestamp && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(step.timestamp)}
                  </span>
                )}
              </div>
              {step.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
