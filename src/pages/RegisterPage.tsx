import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Grid, Mail, Lock, User, Building, AlertCircle, CheckCircle2 } from 'lucide-react'

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [department, setDepartment] = useState('')
  const [studentStaffId, setStudentStaffId] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            department,
            student_staff_id: studentStaffId,
          },
        },
      })

      if (error) {
        setErrorMsg(error.message)
      } else if (data.session) {
        navigate('/resources')
      } else {
        setSuccess(true)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-navy">Account Created!</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your profile has been created with default <strong>REQUESTER</strong> role. You can now sign in to explore and request campus resources.
          </p>
          <Link to="/login">
            <Button className="w-full bg-navy hover:bg-navy-800 text-xs">Proceed to Sign In</Button>
          </Link>
        </Card>
      </div>
    )
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
          <h2 className="text-xl font-semibold text-foreground">Create campus account</h2>
          <p className="text-xs text-muted-foreground">Shikha's Organisation</p>
        </div>

        <Card className="border-border shadow-xs">
          <form onSubmit={handleSubmit}>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Register as Requester</CardTitle>
              <CardDescription className="text-xs">
                Fill in your institutional profile details. Default role is REQUESTER.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3.5">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-navy">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    required
                    placeholder="Aarav Sharma"
                    className="pl-9 h-9 text-xs"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

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

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-navy">Department</label>
                  <Input
                    type="text"
                    placeholder="Robotics"
                    className="h-9 text-xs"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-navy">ID / Roll No</label>
                  <Input
                    type="text"
                    placeholder="SKO-2024-042"
                    className="h-9 text-xs"
                    value={studentStaffId}
                    onChange={(e) => setStudentStaffId(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-navy">Password (min 8 characters)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    required
                    minLength={8}
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
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Already registered?{' '}
                <Link to="/login" className="font-semibold text-teal-700 hover:underline">
                  Sign in here
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}


