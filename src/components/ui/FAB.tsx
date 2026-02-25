import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'

export function FAB() {
  const openQuickAdd = useUIStore((s) => s.openQuickAdd)

  return (
    <motion.button
      onClick={openQuickAdd}
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg"
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      style={{
        boxShadow: '0 4px 24px rgba(139, 92, 246, 0.4), 0 0 40px rgba(139, 92, 246, 0.15)',
      }}
      aria-label="Add food"
    >
      <Plus size={24} strokeWidth={2.5} />
    </motion.button>
  )
}
