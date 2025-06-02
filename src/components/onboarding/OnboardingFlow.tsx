import { motion, AnimatePresence } from 'framer-motion'
import { useOnboarding } from '../../hooks/useOnboarding'
import { useNavigate } from 'react-router-dom'
import OnboardingHeader from './OnboardingHeader'
import PersonalDataStep from './steps/PersonalDataStep'
import GoalsStep from './steps/GoalsStep'
import ActivityStep from './steps/ActivityStep'
import TrainingStep from './steps/TrainingStep'
import DietStep from './steps/DietStep'
import SummaryStep from './steps/SummaryStep'

export default function OnboardingFlow() {
  const navigate = useNavigate()
  const {
    currentStep,
    totalSteps,
    progress,
    nextStep,
    previousStep,
    isStepValid,
    calculateAndSaveProfile
  } = useOnboarding()

  const handleNext = () => {
    if (currentStep === totalSteps - 1) {
      // Final step - calculate and save profile
      try {
        calculateAndSaveProfile()
        navigate('/dashboard')
      } catch (error) {
        console.error('Failed to save profile:', error)
      }
    } else {
      nextStep()
    }
  }

  const handlePrevious = () => {
    if (currentStep === 0) {
      navigate('/')
    } else {
      previousStep()
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <PersonalDataStep />
      case 1:
        return <GoalsStep />
      case 2:
        return <ActivityStep />
      case 3:
        return <TrainingStep />
      case 4:
        return <DietStep />
      case 5:
        return <SummaryStep />
      default:
        return <PersonalDataStep />
    }
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  }

  return (
    <div className="min-h-screen bg-dark-primary safe-area">
      {/* Header with progress */}
      <OnboardingHeader 
        progress={progress}
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={handlePrevious}
      />

      {/* Main content area */}
      <div className="flex-1 px-6 py-4">
        <AnimatePresence mode="wait" custom={1}>
          <motion.div
            key={currentStep}
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="h-full"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="safe-area px-6 py-4 bg-dark-primary/95 backdrop-blur-apple border-t border-dark-quaternary/30">
        <div className="flex gap-3">
          <motion.button
            onClick={handlePrevious}
            className="flex-1 btn-secondary"
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.1 }}
          >
            {currentStep === 0 ? 'Zurück' : 'Vorheriger'}
          </motion.button>

          <motion.button
            onClick={handleNext}
            disabled={!isStepValid(currentStep)}
            className="flex-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            whileTap={{ scale: isStepValid(currentStep) ? 0.98 : 1 }}
            transition={{ duration: 0.1 }}
          >
            {currentStep === totalSteps - 1 ? 'Profil erstellen' : 'Weiter'}
          </motion.button>
        </div>
      </div>
    </div>
  )
} 