import { motion } from 'framer-motion'
import { Utensils, Calendar, Pill } from 'lucide-react'
import { useOnboarding } from '../../../hooks/useOnboarding'

export default function DietStep() {
  const { state, updateDiet } = useOnboarding()
  const { diet } = state

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
  }

  const dayTypes = [
    { value: 'training', label: 'Trainingstag', description: 'Mehr Kalorien und Kohlenhydrate', emoji: '💪' },
    { value: 'rest', label: 'Ruhetag', description: 'Moderate Kalorien, weniger Kohlenhydrate', emoji: '😌' },
    { value: 'fasting', label: 'Fastentag', description: 'Intermittent Fasting oder verlängertes Fasten', emoji: '⏱️' },
    { value: 'refeed', label: 'Refeed-Tag', description: 'Hohe Kohlenhydrate alle 7-14 Tage', emoji: '🔥' }
  ]

  const supplements = [
    'Whey Protein', 'Kreatin', 'Ashwagandha', 'Omega-3', 'Vitamin D3',
    'Magnesium', 'Zink', 'Multivitamin', 'Pre-Workout', 'BCAA'
  ]

  const fastingSupplements = [
    { value: 'yohimbine', label: 'Yohimbin HCl', description: 'Fettverbrennung unterstützen' },
    { value: 'rauwolscine', label: 'Rauwolscin', description: 'Alpha-2 Antagonist' }
  ]

  const toggleDayType = (type: string) => {
    const currentTypes = diet.dayTypes || {}
    updateDiet({
      dayTypes: {
        ...currentTypes,
        [type]: !currentTypes[type as keyof typeof currentTypes]
      }
    })
  }

  const toggleSupplement = (supplement: string) => {
    const currentSupplements = diet.supplements || []
    const newSupplements = currentSupplements.includes(supplement)
      ? currentSupplements.filter(s => s !== supplement)
      : [...currentSupplements, supplement]
    
    updateDiet({ supplements: newSupplements })
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <motion.div {...fadeInUp} className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Utensils className="w-8 h-8 text-white" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold text-dark-gray-primary mb-2">
          Ernährungsstrategie
        </h2>
        <p className="text-dark-gray-tertiary">
          Definiere deine bevorzugten Tagestypen und Supplements
        </p>
      </motion.div>

      <motion.div {...fadeInUp} className="space-y-6">
        {/* Day Types */}
        <div>
          <label className="block text-sm font-medium text-dark-gray-primary mb-3">
            <Calendar className="w-4 h-4 inline mr-2" />
            Tagestypen aktivieren
          </label>
          <div className="space-y-3">
            {dayTypes.map((dayType) => (
              <motion.button
                key={dayType.value}
                onClick={() => toggleDayType(dayType.value)}
                className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                  diet.dayTypes?.[dayType.value as keyof typeof diet.dayTypes]
                    ? 'bg-dark-accent text-white'
                    : 'bg-dark-tertiary text-dark-gray-primary hover:bg-dark-quaternary'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{dayType.emoji}</span>
                  <div className="flex-1">
                    <div className="font-medium">{dayType.label}</div>
                    <div className={`text-sm mt-1 ${
                      diet.dayTypes?.[dayType.value as keyof typeof diet.dayTypes]
                        ? 'text-blue-200'
                        : 'text-dark-gray-quaternary'
                    }`}>
                      {dayType.description}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Custom Macros */}
        <div>
          <label className="block text-sm font-medium text-dark-gray-primary mb-3">
            Makro-Anpassung
          </label>
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              onClick={() => updateDiet({ customMacros: false })}
              className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                diet.customMacros === false
                  ? 'bg-dark-accent text-white'
                  : 'bg-dark-tertiary text-dark-gray-primary hover:bg-dark-quaternary'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              Standard
            </motion.button>
            <motion.button
              onClick={() => updateDiet({ customMacros: true })}
              className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                diet.customMacros === true
                  ? 'bg-dark-accent text-white'
                  : 'bg-dark-tertiary text-dark-gray-primary hover:bg-dark-quaternary'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              Individuell
            </motion.button>
          </div>
        </div>

        {/* Fasting Supplements */}
        <div>
          <label className="block text-sm font-medium text-dark-gray-primary mb-3">
            Fasten-Supplements
          </label>
          <div className="space-y-2">
            {fastingSupplements.map((supplement) => (
              <motion.button
                key={supplement.value}
                onClick={() => {
                  const current = diet.fastingSupplements || []
                  const newSupplements = current.includes(supplement.value as any)
                    ? current.filter(s => s !== supplement.value)
                    : [...current, supplement.value as any]
                  updateDiet({ fastingSupplements: newSupplements })
                }}
                className={`w-full p-3 rounded-xl text-left transition-all duration-200 ${
                  diet.fastingSupplements?.includes(supplement.value as any)
                    ? 'bg-dark-accent text-white'
                    : 'bg-dark-tertiary text-dark-gray-primary hover:bg-dark-quaternary'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <div className="font-medium">{supplement.label}</div>
                <div className={`text-sm ${
                  diet.fastingSupplements?.includes(supplement.value as any)
                    ? 'text-blue-200'
                    : 'text-dark-gray-quaternary'
                }`}>
                  {supplement.description}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* General Supplements */}
        <div>
          <label className="block text-sm font-medium text-dark-gray-primary mb-3">
            <Pill className="w-4 h-4 inline mr-2" />
            Supplements (optional)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {supplements.map((supplement) => (
              <motion.button
                key={supplement}
                onClick={() => toggleSupplement(supplement)}
                className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  diet.supplements?.includes(supplement)
                    ? 'bg-dark-accent text-white'
                    : 'bg-dark-tertiary text-dark-gray-primary hover:bg-dark-quaternary'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                {supplement}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
} 