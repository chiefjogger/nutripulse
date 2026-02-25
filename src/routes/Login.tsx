import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function Login() {
  const session = useAuthStore((s) => s.session)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  if (session) {
    return <Navigate to="/" replace />
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/nutripulse/`,
      },
    })
    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setSent(true)
    toast.success('Check your email for the login link!')
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg-primary px-6">
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Logo */}
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 glow-accent">
                  <span className="text-2xl">N</span>
                </div>
                <h1 className="text-2xl font-bold gradient-text">NutriPulse</h1>
                <p className="mt-1 text-sm text-text-muted">
                  Track smarter, eat better
                </p>
              </div>

              {/* Login form */}
              <form onSubmit={handleLogin} className="glass-card rounded-2xl p-6 space-y-4">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail size={16} />}
                  autoFocus
                  required
                />
                <Button
                  type="submit"
                  isLoading={loading}
                  className="w-full"
                  size="lg"
                >
                  Send Login Link
                </Button>
                <p className="text-center text-xs text-text-muted">
                  We'll email you a magic link. No password needed.
                </p>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="glass-card rounded-2xl p-8 space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
                  <Mail size={24} className="text-success" />
                </div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Check your email
                </h2>
                <p className="text-sm text-text-secondary">
                  We sent a login link to{' '}
                  <span className="font-medium text-text-primary">{email}</span>
                </p>
                <p className="text-xs text-text-muted">
                  Click the link in the email to sign in.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-light transition-colors"
                >
                  <ArrowLeft size={14} />
                  Use a different email
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
