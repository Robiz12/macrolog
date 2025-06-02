import { motion } from 'framer-motion'
import { Clock, Sun, Sunset, Moon, Zap, Dumbbell } from 'lucide-react'
import { useOnboarding } from '../../../hooks/useOnboarding'

export default function TrainingStep() {
  const { state, updateTraining } = useOnboarding()
  const { training } = state

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
  }

  const timingOptions = [
    { value: 'morning', label: 'Morgens', icon: Sun, time: '6-10 Uhr' },
    { value: 'noon', label: 'Mittags', icon: Sun, time: '11-15 Uhr' },
    { value: 'evening', label: 'Abends', icon: Sunset, time: '16-20 Uhr' },
    { value: 'flexible', label: 'Flexibel', icon: Clock, time: 'Wechselt' }
  ]

  const handleFocusChange = (type: 'strength' | 'hypertrophy', value: number) => {
    const otherType = type === 'strength' ? 'hypertrophy' : 'strength'
    const otherValue = 100 - value
    
    updateTraining({
      focusRatio: {
        strength: type === 'strength' ? value : otherValue,
        hypertrophy: type === 'hypertrophy' ? value : otherValue
      }
    })
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <motion.div {...fadeInUp} className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Dumbbell className="w-8 h-8 text-white" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold text-dark-gray-primary mb-2">
          Trainingsdetails
        </h2>
        <p className="text-dark-gray-tertiary">
          Optimiere dein Training für maximale Ergebnisse
        </p>
      </motion.div>

      <motion.div {...fadeInUp} className="space-y-6">
        {/* Session Duration */}
        <div>
          <label className="block text-sm font-medium text-dark-gray-primary mb-2">
            <Clock className="w-4 h-4 inline mr-2" />
            Trainingsdauer (Minuten)
          </label>
          <input
            type="number"
            value={training.sessionDuration || ''}
            onChange={(e) => updateTraining({ sessionDuration: Number(e.target.value) })}
            placeholder="60"
            className="input w-full"
          />
          <p className="text-xs text-dark-gray-quaternary mt-1">
            Empfohlen: 45-90 Minuten für optimale Ergebnisse
          </p>
        </div>

        {/* Preferred Time */}
        <div>
          <label className="block text-sm font-medium text-dark-gray-primary mb-3">
            Bevorzugte Trainingszeit
          </label>
          <div className="grid grid-cols-2 gap-3">
            {timingOptions.map((option) => {
              const IconComponent = option.icon
              return (
                <motion.button
                  key={option.value}
                  onClick={() => updateTraining({ preferredTime: option.value as any })}
                  className={`p-4 rounded-xl text-left transition-all duration-200 ${
                    training.preferredTime === option.value
                      ? 'bg-dark-accent text-white'
                      : 'bg-dark-tertiary text-dark-gray-primary hover:bg-dark-quaternary'
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <IconComponent className="w-4 h-4" strokeWidth={1.5} />
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <div className={`text-xs ${
                    training.preferredTime === option.value
                      ? 'text-blue-200'
                      : 'text-dark-gray-quaternary'
                  }`}>
                    {option.time}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Training Intensity */}
        <div>
          <label className="block text-sm font-medium text-dark-gray-primary mb-3">
            <Zap className="w-4 h-4 inline mr-2" />
            Trainingsintensität
          </label>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-dark-gray-tertiary">Niedrig (1)</span>
              <span className="text-sm text-dark-gray-tertiary">Hoch (10)</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={training.intensity || 5}
              onChange={(e) => updateTraining({ intensity: Number(e.target.value) })}
              className="w-full h-2 bg-dark-tertiary rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="text-center">
              <span className="text-lg font-bold text-dark-accent">
                {training.intensity || 5}/10
              </span>
            </div>
          </div>
        </div>

        {/* Focus Ratio */}
        <div>
          <label className="block text-sm font-medium text-dark-gray-primary mb-3">
            Trainingsausrichtung
          </label>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-dark-gray-primary">Kraft</span>
              <span className="text-sm font-medium text-dark-gray-primary">Hypertrophie</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={training.focusRatio?.strength || 50}
              onChange={(e) => handleFocusChange('strength', Number(e.target.value))}
              className="w-full h-2 bg-dark-tertiary rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-sm">
              <span className="text-dark-accent font-medium">
                {training.focusRatio?.strength || 50}% Kraft
              </span>
              <span className="text-purple-400 font-medium">
                {training.focusRatio?.hypertrophy || 50}% Hypertrophie
              </span>
            </div>
          </div>
          <p className="text-xs text-dark-gray-quaternary mt-2">
            Kraft = schwere Gewichte, wenige Wiederholungen<br/>
            Hypertrophie = moderate Gewichte, mehr Wiederholungen
          </p>
        </div>
      </motion.div>
    </div>
  )
} 