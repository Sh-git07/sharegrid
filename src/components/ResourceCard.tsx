import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Clock, ShieldCheck, User } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import { StatusBadge } from './StatusBadge'
import { Badge } from './ui/badge'
import { formatDurationMinutes } from '../lib/dates'

interface ResourceCardProps {
  id: string
  title: string
  description: string
  categoryName?: string
  locationName: string
  status: string
  imageUrl?: string
  ownerName?: string
  minDurationMinutes?: number
  maxDurationMinutes?: number
  requiresSupervision?: boolean
  depositAmount?: number
}

export function ResourceCard({
  id,
  title,
  description,
  categoryName,
  locationName,
  status,
  imageUrl,
  ownerName,
  minDurationMinutes,
  maxDurationMinutes,
  requiresSupervision,
  depositAmount,
}: ResourceCardProps) {
  const fallbackImage = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'

  return (
    <Link to={`/resources/${id}`} className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
      <Card className="h-full overflow-hidden hover:shadow-md transition-all duration-200 border-border/80 group-hover:border-navy-200 flex flex-col">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <img
            src={imageUrl || fallbackImage}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute top-3 right-3">
            <StatusBadge status={status} className="shadow-sm" />
          </div>
          {categoryName && (
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="bg-white/95 text-navy font-medium backdrop-blur-sm shadow-sm">
                {categoryName}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-navy text-lg leading-snug line-clamp-1 group-hover:text-teal-700 transition-colors">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
              {description}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-border/60 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 truncate">
                <MapPin className="h-3.5 w-3.5 text-navy-400 shrink-0" />
                <span className="truncate">{locationName}</span>
              </span>
              {ownerName && (
                <span className="flex items-center gap-1 shrink-0 text-navy-600 font-medium">
                  <User className="h-3 w-3" />
                  <span className="truncate max-w-[100px]">{ownerName}</span>
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-teal-600" />
                <span>
                  {minDurationMinutes && maxDurationMinutes
                    ? `${formatDurationMinutes(minDurationMinutes)} - ${formatDurationMinutes(maxDurationMinutes)}`
                    : 'Flexible hours'}
                </span>
              </span>

              <div className="flex items-center gap-1.5">
                {requiresSupervision && (
                  <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                    <ShieldCheck className="h-2.5 w-2.5 mr-0.5" /> Supervised
                  </Badge>
                )}
                {depositAmount && depositAmount > 0 ? (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-800">
                    Deposit ₹{depositAmount}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
