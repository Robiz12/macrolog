import { motion } from 'framer-motion'
import { Briefcase, Footprints, Calendar } from 'lucide-react'
import { useOnboarding } from '../../../hooks/useOnboarding'

export default function ActivityStep() {
  const { state, updateActivity } = useOnboarding()
  const { activity } = state

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
  }

  const occupations = [
    { value: 'office', label: 'Bürojob', description: 'Überwiegend sitzend' },
    { value: 'standing', label: 'Stehend/Gehend', description: 'Moderate Bewegung' },
    { value: 'physical', label: 'Körperlich aktiv', description: 'Schwere körperliche Arbeit' }
  ]

  const trainingSplits = [
    { value: 'full_body', label: 'Ganzkörper', description: 'Alle Muskelgruppen pro Einheit' },
    { value: 'push_pull', label: 'Push/Pull', description: 'Drücken und Ziehen getrennt' },
    { value: 'ppl', label: 'Push/Pull/Legs', description: 'Drücken, Ziehen, Beine' },
    { value: 'custom', label: 'Eigener Split', description: 'Individuell anpassen' }
  ]

  return (
    <div className="max-w-md mx-auto space-y-6">
      <motion.div {...fadeInUp} className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-white" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold text-dark-gray-primary mb-2">
          Dein Aktivitätslevel
        </h2>
        <p className="text-dark-gray-tertiary">
          Hilf uns, deinen täglichen Energieverbrauch zu verstehen
        </p>
      </motion.div>

      <motion.div {...fadeInUp} className="space-y-6">
        {/* Occupation */}
        <div>
          <label className="block text-sm font-medium text-dark-gray-primary mb-3">
            <Briefcase className="w-4 h-4 inline mr-2" />
            Berufliche Aktivität
          </label>
          <div className="space-y-2">
            {occupations.map((occupation) => (
              <motion.button
                key={occupation.value}
                onClick={() => updateActivity({ occupation: occupation.value as any })}
                className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                  activity.occupation === occupation.value
                    ? 'bg-dark-accent text-white'
                    : 'bg-dark-tertiary text-dark-gray-primary hover:bg-dark-quaternary'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <div className="font-medium">{occupation.label}</div>
                <div className={`text-sm ${
                  activity.occupation === occupation.value
                    ? 'text-blue-200'
                    : 'text-dark-gray-quaternary'
                }`}>
                  {occupation.description}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Daily Steps */}
        <div>
          <label className="block text-sm font-medium text-dark-gray-primary mb-2">
            <Footprints className="w-4 h-4 inline mr-2" />
            Durchschnittliche Schritte pro Tag
          </label>
          <input
            type="number"
            value={activity.dailySteps || ''}
            onChange={(e) => updateActivity({ dailySteps: Number(e.target.value) })}
            placeholder="8000"
            className="input w-full"
          />
          <p className="text-xs text-dark-gray-quaternary mt-1">
            Falls unbekannt: ca. 3000-5000 (wenig aktiv), 7500-10000 (aktiv), 10000+ (sehr aktiv)
          </p>
        </div>

        {/* Training Frequency */}
        <div>
          <label className="block text-sm font-medium text-dark-gray-primary mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Trainingsfrequenz pro Woche
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[2, 3, 4, 5, 6].map((freq) => (
              <motion.button
                key={freq}
                onClick={() => updateActivity({ weeklyTrainingFrequency: freq })}
                className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activity.weeklyTrainingFrequency === freq
                    ? 'bg-dark-accent text-white'
                    : 'bg-dark-tertiary text-dark-gray-primary hover:bg-dark-quaternary'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                {freq}x
              </motion.button>
            ))}
          </div>
        </div>

        {/* Training Split */}
        <div>
          <label className="block text-sm font-medium text-dark-gray-primary mb-3">
            Trainingssplit
          </label>
          <div className="space-y-2">
            {trainingSplits.map((split) => (
              <motion.button
                key={split.value}
                onClick={() => updateActivity({ trainingSplit: split.value as any })}
                className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                  activity.trainingSplit === split.value
                    ? 'bg-dark-accent text-white'
                    : 'bg-dark-tertiary text-dark-gray-primary hover:bg-dark-quaternary'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <div className="font-medium">{split.label}</div>
                <div className={`text-sm ${
                  activity.trainingSplit === split.value
                    ? 'text-blue-200'
                    : 'text-dark-gray-quaternary'
                }`}>
                  {split.description}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
} 