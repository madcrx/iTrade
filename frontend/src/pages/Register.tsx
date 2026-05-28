import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TrendingUp, Mail, Lock, User, Eye, EyeOff, AlertCircle, Check } from 'lucide-react'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const PASSWORD_RULES = [
  { label: '8+ characters', check: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', check: (p: string) => /[A-Z]/.test(p) },
  { label: 'Number', check: (p: string) => /\d/.test(p) },
]

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const passwordValid = PASSWORD_RULES.every((r) => r.check(form.password))
  const passwordsMatch = form.password === form.confirmPassword && form.confirmPassword.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!passwordValid) {
      setError('Password does not meet requirements.')
      return
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const resp = await authApi.register({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
      })
      login(resp.user, resp.access_token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4 py-12">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-bull/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 bg-accent-blue rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold">
              i<span className="text-accent-blue">Trade</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">Create your account</h1>
          <p className="text-text-secondary mt-1">Start receiving AI signals today — it's free</p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-bear/10 border border-bear/20 rounded-xl animate-fade-in">
                <AlertCircle className="h-4 w-4 text-bear flex-shrink-0" />
                <p className="text-sm text-bear">{error}</p>
              </div>
            )}

            <Input
              label="Full name"
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Alex Johnson"
              autoComplete="name"
              required
              leftIcon={<User className="h-4 w-4" />}
            />

            <Input
              label="Email address"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              autoComplete="email"
              required
              leftIcon={<Mail className="h-4 w-4" />}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            {/* Password rules */}
            {form.password.length > 0 && (
              <div className="flex flex-wrap gap-2 animate-fade-in">
                {PASSWORD_RULES.map((rule) => (
                  <div
                    key={rule.label}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      rule.check(form.password)
                        ? 'bg-bull/10 text-bull'
                        : 'bg-border text-text-muted'
                    }`}
                  >
                    <Check className="h-3 w-3" />
                    {rule.label}
                  </div>
                ))}
              </div>
            )}

            <Input
              label="Confirm password"
              type={showPassword ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              leftIcon={<Lock className="h-4 w-4" />}
              error={
                form.confirmPassword.length > 0 && !passwordsMatch
                  ? 'Passwords do not match'
                  : undefined
              }
            />

            <Button
              type="submit"
              fullWidth
              loading={loading}
              size="lg"
              disabled={!passwordValid || !passwordsMatch}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-accent-blue hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-text-muted mt-6 leading-relaxed">
          By creating an account, you confirm iTrade is a signal tool only —
          not financial advice. Always conduct your own research.
        </p>
      </div>
    </div>
  )
}
