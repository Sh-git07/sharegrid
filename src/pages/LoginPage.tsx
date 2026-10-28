import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { DemoLoginPanel } from '../components/DemoLoginPanel'
import { Grid, Lock, Mail, AlertCircle } from 'lucide-react'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as any)?.from?.pathname

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) {
        setErrorMsg(error.message)
      } else {
        navigate(from || '/resources', { replace: true })
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-navy flex items-center justify-center text-white shadow-xs">
              <Grid className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-navy">ShareGrid</span>
          </Link>
          <h2 className="text-xl font-semibold text-foreground">Sign in to your campus account</h2>
          <p className="text-xs text-muted-foreground">Shikha's Organisation</p>
        </div>

        {/* Demo Fast Login Panel */}
        <DemoLoginPanel onSuccess={(targetPath) => navigate(from || targetPath, { replace: true })} />

        <Card className="border-border shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Or sign in with email</CardTitle>
            <CardDescription className="text-xs">
              Enter your credentials to access your bookings and equipment
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-navy">Campus Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    required
                    placeholder="student@shikhaoorg.edu"
                    className="pl-9 h-9 text-xs"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-navy">Password</label>
                  <Link to="/forgot-password" className="text-xs text-teal-700 hover:underline">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="pl-9 h-9 text-xs"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button type="submit" disabled={loading} className="w-full bg-navy hover:bg-navy-800 font-semibold h-9 text-xs">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-teal-700 hover:underline">
                  Register here
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}


