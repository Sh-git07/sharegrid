import React from 'react'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

export function TermsPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-6">
      <div className="space-y-2">
        <Badge variant="secondary" className="text-xs">Institutional Regulations</Badge>
        <h1 className="text-3xl font-bold text-navy">Equipment Usage Terms & Policy</h1>
        <p className="text-xs text-muted-foreground">Governing Shikha's Organisation Shared Laboratory Resources</p>
      </div>

      <Card className="p-8 space-y-4 border-border text-xs leading-relaxed text-foreground/80">
        <h2 className="text-sm font-bold text-navy">1. Prerequisite Qualification</h2>
        <p>
          Reservations require verified prerequisite training modules (e.g. SAFE-3D-101 for additive manufacturing, ELEC-201 for electronics instrumentation). Falsifying certification evidence is subject to disciplinary escalation.
        </p>

        <h2 className="text-sm font-bold text-navy">2. Check-In & Handover Accountability</h2>
        <p>
          Requesters must complete the initial handover checklist within 15 minutes of scheduled start. Users are responsible for inspecting the machine and documenting any pre-existing damage. Failure to log initial damage will result in shared accountability.
        </p>

        <h2 className="text-sm font-bold text-navy">3. Timely Return & Cleaning</h2>
        <p>
          Equipment must be cleaned, powered down, and returned with all cables and accessories before the scheduled end time. A buffer window is enforced by the database to ensure facility readiness for the next researcher.
        </p>

        <h2 className="text-sm font-bold text-navy">4. Incident Reporting</h2>
        <p>
          In the event of tool wear, nozzle clog, or component failure, users must file an immediate incident report. ShareGrid follows a no-fault learning culture for honest reports, whereas unreported damage leads to restriction of reservation privileges.
        </p>
      </Card>
    </div>
  )
}

