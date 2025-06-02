import { motion } from 'framer-motion'
import { Target, TrendingDown, Zap, Dumbbell, Heart, MapPin } from 'lucide-react'
import { useOnboarding } from '../../../hooks/useOnboarding'

export default function GoalsStep() {
  const { state, updateGoals } = useOnboarding()
  const { goals } = state

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
  }

  const primaryGoals = [
    { 
      value: 'fat_loss', 
      label: 'Fettabbau', 
      description: 'Körperfett reduzieren und Definition verbessern',
      icon: TrendingDown,
      color: 'from-red-500 to-orange-500'
    },
    { 
      value: 'recomposition', 
      label: 'Body Recomposition', 
      description: 'Gleichzeitig Fett abbauen und Muskeln aufbauen',
      icon: Target,
      color: 'from-purple-500 to-pink-500'
    },
    { 
      value: 'muscle_gain', 
      label: 'Muskelaufbau', 
      description: 'Muskelmasse und Kraft steigern',
      icon: Dumbbell,
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      value: 'performance', 
      label: 'Leistung & Performance', 
      description: 'Athletische Leistung und Kraft verbessern',
      icon: Zap,
      color: 'from-yellow-500 to-orange-500'
    },
    { 
      value: 'health', 
      label: 'Gesundheit & Erhaltung', 
      description: 'Fitness erhalten und Gesundheit fördern',
      icon: Heart,
      color: 'from-green-500 to-emerald-500'
    }
  ]

  const targetAreas = [
    { value: 'abs', label: 'Bauchfett', emoji: '🔥' },
    { value: 'hips', label: 'Hüfte', emoji: '⚡' },
    { value: 'chest', label: 'Brust', emoji: '💪' },
    { value: 'thighs', label: 'Oberschenkel', emoji: '🦵' },
    { value: 'general', label: 'Allgemein', emoji: '✨' }
  ]

  const toggleTargetArea = (area: string) => {
    const currentAreas = goals.targetAreas || []
    const newAreas = currentAreas.includes(area as any)
      ? currentAreas.filter(a => a !== area)
      : [...currentAreas, area as any]
    
    updateGoals({ targetAreas: newAreas })
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <motion.div {...fadeInUp} className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-dark-accent to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-white" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold text-dark-gray-primary mb-2">
          Was ist dein Ziel?
        </h2>
        <p className="text-dark-gray-tertiary">
          Wähle dein Hauptziel - wir passen alles entsprechend an
        </p>
      </motion.div>

      <motion.div {...fadeInUp} className="space-y-6">
        {/* Primary Goal */}
        <div>
          <label className="block text-sm font-medium text-dark-gray-primary mb-4">
            Primäres Ziel
          </label>
          <div className="space-y-3">
            {primaryGoals.map((goal) => {
              const IconComponent = goal.icon
              return (
                <motion.button
                  key={goal.value}
                  onClick={() => updateGoals({ primary: goal.value as any })}
                  className={`w-full p-4 rounded-2xl text-left transition-all duration-200 ${
                    goals.primary === goal.value
                      ? 'bg-dark-accent text-white'
                      : 'bg-dark-tertiary text-dark-gray-primary hover:bg-dark-quaternary'
                  }`}
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      goals.primary === goal.value
                        ? 'bg-white/20'
                        : 'bg-gradient-to-br ' + goal.color
                    }`}>
                      <IconComponent className="w-5 h-5 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{goal.label}</div>
                      <div className={`text-sm mt-1 ${
                        goals.primary === goal.value
                          ? 'text-blue-200'
                          : 'text-dark-gray-quaternary'
                      }`}>
                        {goal.description}
                      </div>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Target Areas */}
        <div>
          <label className="block text-sm font-medium text-dark-gray-primary mb-3">
            <MapPin className="w-4 h-4 inline mr-2" />
            Zielregionen (mehrere möglich)
          </label>
          <div className="grid grid-cols-2 gap-3">
            {targetAreas.map((area) => (
              <motion.button
                key={area.value}
                onClick={() => toggleTargetArea(area.value)}
                className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  goals.targetAreas?.includes(area.value as any)
                    ? 'bg-dark-accent text-white'
                    : 'bg-dark-tertiary text-dark-gray-primary hover:bg-dark-quaternary'
                }`}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-lg mb-1">{area.emoji}</div>
                <div>{area.label}</div>
              </motion.button>
            ))}
          </div>
          <p className="text-xs text-dark-gray-quaternary mt-2">
            Diese Bereiche werden bei der Trainings- und Ernährungsplanung priorisiert
          </p>
        </div>
      </motion.div>
    </div>
  )
} 