import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Grid, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div className="min-h-[70vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-navy flex items-center justify-center text-white shadow-xs">
              <Grid className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-navy">ShareGrid</span>
          </Link>
          <h2 className="text-xl font-semibold text-foreground">Reset Password</h2>
        </div>

        <Card className="border-border shadow-xs">
          {submitted ? (
            <CardContent className="p-6 text-center space-y-3">
              <CheckCircle2 className="h-8 w-8 text-teal-600 mx-auto" />
              <h3 className="font-semibold text-navy text-sm">Instructions Dispatched</h3>
              <p className="text-xs text-muted-foreground">
                If an account exists with {email}, a recovery link has been generated.
              </p>
              <Link to="/login">
                <Button variant="outline" size="sm" className="mt-2 text-xs">
                  Back to Sign In
                </Button>
              </Link>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Password Recovery</CardTitle>
                <CardDescription className="text-xs">
                  Enter your registered institutional email to receive reset instructions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
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
              </CardContent>
              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button type="submit" disabled={loading} className="w-full bg-navy hover:bg-navy-800 text-xs h-9">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <Link to="/login" className="text-xs text-muted-foreground hover:text-navy flex items-center gap-1 justify-center">
                  <ArrowLeft className="h-3 w-3" /> Back to Sign In
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}

