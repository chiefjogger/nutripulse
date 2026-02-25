import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'

export function WelcomeHero() {
  const profile = useAuthStore((s) => s.profile)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/20 via-bg-card to-calories/10 p-5">
      {/* Decorative floating orbs */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-accent/10 blur-2xl animate-float-orb" />
      <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-calories/10 blur-2xl animate-float-orb-delay" />
      <div className="absolute top-1/2 right-1/4 w-16 h-16 rounded-full bg-protein/8 blur-xl animate-float-orb-delay-2" />

      {/* Animated SVG decoration */}
      <div className="absolute right-3 top-3 opacity-20">
        <motion.svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          initial={{ rotate: 0, scale: 0.8 }}
          animate={{ rotate: 360, scale: 1 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <circle cx="32" cy="32" r="28" stroke="var(--color-accent)" strokeWidth="1" strokeDasharray="4 6" opacity="0.5" />
          <circle cx="32" cy="32" r="20" stroke="var(--color-calories)" strokeWidth="1" strokeDasharray="3 5" opacity="0.4" />
          <circle cx="32" cy="32" r="12" stroke="var(--color-protein)" strokeWidth="1" strokeDasharray="2 4" opacity="0.3" />
        </motion.svg>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <motion.p
          className="text-sm text-text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {greeting},
        </motion.p>
        <motion.h1
          className="text-xl font-bold gradient-text mt-0.5"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 120 }}
        >
          {profile?.display_name ?? 'there'}
        </motion.h1>
      </motion.div>

      {/* Animated food emoji line */}
      <motion.div
        className="flex gap-2 mt-3 text-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.5 }}
      >
        {['🥗', '🍜', '🥩', '🍚', '🥑'].map((emoji, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.1, type: 'spring', stiffness: 200 }}
          >
            {emoji}
          </motion.span>
        ))}
      </motion.div>
    </div>
  )
}
