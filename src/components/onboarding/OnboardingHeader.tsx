import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'

interface OnboardingHeaderProps {
  progress: number
  currentStep: number
  totalSteps: number
  onBack: () => void
}

export default function OnboardingHeader({ 
  progress, 
  currentStep, 
  totalSteps, 
  onBack 
}: OnboardingHeaderProps) {
  const stepTitles = [
    'Persönliche Daten',
    'Deine Ziele',
    'Aktivitätslevel',
    'Training',
    'Ernährung',
    'Zusammenfassung'
  ]

  return (
    <header className="px-6 py-4 bg-dark-primary/95 backdrop-blur-apple border-b border-dark-quaternary/30">
      <div className="flex items-center gap-4 mb-4">
        <motion.button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-dark-tertiary flex items-center justify-center"
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.1 }}
        >
          <ChevronLeft className="w-5 h-5 text-dark-gray-primary" strokeWidth={2} />
        </motion.button>

        <div className="flex-1">
          <h1 className="text-lg font-semibold text-dark-gray-primary">
            {stepTitles[currentStep]}
          </h1>
          <p className="text-sm text-dark-gray-tertiary">
            Schritt {currentStep + 1} von {totalSteps}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-dark-tertiary rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-dark-accent to-blue-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between mt-3">
        {Array.from({ length: totalSteps }, (_, index) => (
          <motion.div
            key={index}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors duration-200 ${
              index <= currentStep
                ? 'bg-dark-accent text-white'
                : 'bg-dark-tertiary text-dark-gray-quaternary'
            }`}
            initial={{ scale: 0.8 }}
            animate={{ 
              scale: index === currentStep ? 1.1 : 1,
              backgroundColor: index <= currentStep ? '#007AFF' : '#2c2c2e'
            }}
            transition={{ duration: 0.2 }}
          >
            {index + 1}
          </motion.div>
        ))}
      </div>
    </header>
  )
} 