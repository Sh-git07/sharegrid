import { Routes, Route, Navigate } from 'react-router-dom'

// Pages (lazy-loaded placeholders until features are built)
function HomePage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-navy mb-2">ShareGrid</h1>
        <p className="text-lg text-muted-foreground">Campus Resource Sharing Platform</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
        {['Resources', 'Bookings', 'Dashboard'].map((item) => (
          <div
            key={item}
            className="rounded-xl border bg-card p-6 text-center shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="font-semibold text-navy">{item}</p>
            <p className="text-sm text-muted-foreground mt-1">Coming soon</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Phase 1 & 2 scaffolding complete ✓</p>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/resources" element={<Navigate to="/" replace />} />
      <Route path="/bookings" element={<Navigate to="/" replace />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
