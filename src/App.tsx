import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import WelcomeScreen from './components/screens/WelcomeScreen'
import SimpleOnboardingFlow from './components/onboarding/SimpleOnboardingFlow'
import Dashboard from './components/screens/Dashboard'
import { useLocalStorage } from './hooks/useLocalStorage'

function App() {
  const [hasOnboarded, setHasOnboarded] = useLocalStorage('hasOnboarded', false)

  return (
    <div className="min-h-screen bg-dark-primary safe-area">
      <Router>
        <AnimatePresence mode="wait">
          <Routes>
            <Route 
              path="/" 
              element={
                hasOnboarded ? (
                  <Dashboard />
                ) : (
                  <WelcomeScreen />
                )
              } 
            />
            <Route path="/onboarding" element={<SimpleOnboardingFlow />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </AnimatePresence>
      </Router>
    </div>
  )
}

export default App 