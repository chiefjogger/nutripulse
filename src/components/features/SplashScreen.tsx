import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-primary"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Animated background orbs */}
            <motion.div
              className="absolute w-64 h-64 rounded-full bg-accent/10 blur-3xl"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0.5 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute w-48 h-48 rounded-full bg-calories/10 blur-3xl"
              style={{ top: '30%', left: '20%' }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 0.4 }}
              transition={{ duration: 1.5, delay: 0.2, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute w-40 h-40 rounded-full bg-protein/10 blur-3xl"
              style={{ bottom: '30%', right: '20%' }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.3, opacity: 0.3 }}
              transition={{ duration: 1.5, delay: 0.4, ease: 'easeOut' }}
            />

            <div className="relative flex flex-col items-center gap-4">
              {/* Animated logo rings */}
              <div className="relative w-24 h-24">
                {/* Outer ring - calories orange */}
                <motion.svg
                  width="96"
                  height="96"
                  viewBox="0 0 96 96"
                  className="absolute inset-0"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                >
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="44"
                    fill="none"
                    stroke="var(--color-calories)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 44}
                    initial={{ strokeDashoffset: 2 * Math.PI * 44 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 44 * 0.25 }}
                    transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                    opacity={0.8}
                  />
                </motion.svg>

                {/* Middle ring - protein blue */}
                <motion.svg
                  width="96"
                  height="96"
                  viewBox="0 0 96 96"
                  className="absolute inset-0"
                  initial={{ rotate: 120 }}
                  animate={{ rotate: 480 }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                >
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="36"
                    fill="none"
                    stroke="var(--color-protein)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 36}
                    initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 36 * 0.3 }}
                    transition={{ duration: 1.2, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
                    opacity={0.8}
                  />
                </motion.svg>

                {/* Inner ring - carbs green */}
                <motion.svg
                  width="96"
                  height="96"
                  viewBox="0 0 96 96"
                  className="absolute inset-0"
                  initial={{ rotate: 240 }}
                  animate={{ rotate: 600 }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                >
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="28"
                    fill="none"
                    stroke="var(--color-carbs)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 28}
                    initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 28 * 0.35 }}
                    transition={{ duration: 1.2, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                    opacity={0.8}
                  />
                </motion.svg>

                {/* Center dot */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
                >
                  <div className="w-4 h-4 rounded-full bg-accent shadow-lg" style={{ boxShadow: '0 0 20px var(--color-accent)' }} />
                </motion.div>
              </div>

              {/* App name */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <h1 className="text-2xl font-bold gradient-text tracking-tight">NutriPulse</h1>
                <motion.p
                  className="text-xs text-text-muted mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  Track smarter, eat better
                </motion.p>
              </motion.div>

              {/* Loading dots */}
              <motion.div
                className="flex gap-1.5 mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-accent"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  )
}
