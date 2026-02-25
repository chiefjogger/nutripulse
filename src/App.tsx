import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { SplashScreen } from '@/components/features/SplashScreen'
import Login from '@/routes/Login'
import Onboarding from '@/routes/Onboarding'
import Dashboard from '@/routes/Dashboard'
import FoodLog from '@/routes/FoodLog'
import FoodSearch from '@/routes/FoodSearch'
import CheckIn from '@/routes/CheckIn'
import Progress from '@/routes/Progress'
import Recipes from '@/routes/Recipes'
import Settings from '@/routes/Settings'

export default function App() {
  const location = useLocation()

  // Initialize auth listener
  useAuth()

  return (
    <SplashScreen>
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Authenticated */}
        <Route element={<RequireAuth />}>
          <Route path="/onboarding" element={<Onboarding />} />

          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="/log" element={<FoodLog />} />
            <Route path="/log/search" element={<FoodSearch />} />
            <Route path="/checkin" element={<CheckIn />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
    </SplashScreen>
  )
}
