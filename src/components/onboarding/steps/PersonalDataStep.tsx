import { motion } from 'framer-motion'
import { User, Calendar, Ruler, Weight, Activity } from 'lucide-react'
import { useOnboarding } from '../../../hooks/useOnboarding'

export default function PersonalDataStep() {
  const { state, updatePersonalData } = useOnboarding()
  const { personal } = state

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
  }

  const trainingLevels = [
    { value: 'beginner', label: 'Anfänger', description: '0-1 Jahre Erfahrung' },
    { value: 'intermediate', label: 'Fortgeschritten', description: '1-3 Jahre Erfahrung' },
    { value: 'advanced', label: 'Erfahren', description: '3-5 Jahre Erfahrung' },
    { value: 'expert', label: 'Experte', description: '5+ Jahre Erfahrung' }
  ]

  return (
    <div className="max-w-md mx-auto space-y-6">
      <motion.div {...fadeInUp} className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-dark-accent to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-white" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold text-dark-gray-primary mb-2">
          Erzähl uns von dir
        </h2>
        <p className="text-dark-gray-tertiary">
          Diese Daten helfen uns, dein perfektes Fitness-Programm zu erstellen
        </p>
      </motion.div>

      <motion.div {...fadeInUp} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-dark-gray-primary mb-2">
            Wie heißt du?
          </label>
          <input
            type="text"
            value={personal.name || ''}
            onChange={(e) => updatePersonalData({ name: e.target.value })}
            placeholder="Dein Name"
            className="input w-full"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-dark-gray-primary mb-3">
            Geschlecht
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'male', label: 'Männlich' },
              { value: 'female', label: 'Weiblich' },
              { value: 'diverse', label: 'Divers' }
            ].map((option) => (
              <motion.button
                key={option.value}
                onClick={() => updatePersonalData({ gender: option.value as any })}
                className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  personal.gender === option.value
                    ? 'bg-dark-accent text-white'
                    : 'bg-dark-tertiary text-dark-gray-primary hover:bg-dark-quaternary'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                {option.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Birth Date */}
        <div>
          <label className="block text-sm font-medium text-dark-gray-primary mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Geburtsdatum
          </label>
          <input
            type="date"
            value={personal.birthDate || ''}
            onChange={(e) => updatePersonalData({ birthDate: e.target.value })}
            className="input w-full"
          />
        </div>

        {/* Height and Weight */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-gray-primary mb-2">
              <Ruler className="w-4 h-4 inline mr-2" />
              Größe (cm)
            </label>
            <input
              type="number"
              value={personal.height || ''}
              onChange={(e) => updatePersonalData({ height: Number(e.target.value) })}
              placeholder="175"
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-gray-primary mb-2">
              <Weight className="w-4 h-4 inline mr-2" />
              Gewicht (kg)
            </label>
            <input
              type="number"
              value={personal.weight || ''}
              onChange={(e) => updatePersonalData({ weight: Number(e.target.value) })}
              placeholder="70"
              className="input w-full"
            />
          </div>
        </div>

        {/* Body Fat (Optional) */}
        <div>
          <label className="block text-sm font-medium text-dark-gray-primary mb-2">
            Körperfettanteil (%, optional)
          </label>
          <input
            type="number"
            value={personal.bodyFatPercentage || ''}
            onChange={(e) => updatePersonalData({ bodyFatPercentage: Number(e.target.value) })}
            placeholder="15"
            className="input w-full"
          />
          <p className="text-xs text-dark-gray-quaternary mt-1">
            Falls unbekannt, können wir das später visuell schätzen
          </p>
        </div>

        {/* Training Level */}
        <div>
          <label className="block text-sm font-medium text-dark-gray-primary mb-3">
            <Activity className="w-4 h-4 inline mr-2" />
            Trainingserfahrung
          </label>
          <div className="space-y-2">
            {trainingLevels.map((level) => (
              <motion.button
                key={level.value}
                onClick={() => updatePersonalData({ trainingLevel: level.value as any })}
                className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                  personal.trainingLevel === level.value
                    ? 'bg-dark-accent text-white'
                    : 'bg-dark-tertiary text-dark-gray-primary hover:bg-dark-quaternary'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <div className="font-medium">{level.label}</div>
                <div className={`text-sm ${
                  personal.trainingLevel === level.value
                    ? 'text-blue-200'
                    : 'text-dark-gray-quaternary'
                }`}>
                  {level.description}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
} 