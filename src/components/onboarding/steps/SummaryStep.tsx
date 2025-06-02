import { motion } from 'framer-motion'
import { CheckCircle, Calculator, Target, Activity } from 'lucide-react'
import { useOnboarding } from '../../../hooks/useOnboarding'
import { 
  calculateBMRWithBodyFat, 
  calculateTDEE, 
  calculateTargetCalories, 
  calculateMacros,
  calculateAge 
} from '../../../utils/calculations'

export default function SummaryStep() {
  const { state } = useOnboarding()
  const { personal, goals, activity, training } = state

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
  }

  // Calculate preview values
  const bmr = personal.name && personal.weight && personal.height && personal.birthDate 
    ? calculateBMRWithBodyFat(personal as any) 
    : 0

  const tdee = bmr && activity.occupation && training.intensity 
    ? calculateTDEE(bmr, activity as any, training as any) 
    : 0

  const calories = tdee && goals.primary 
    ? calculateTargetCalories(tdee, goals.primary) 
    : { training: 0, rest: 0, fasting: 0 }

  const macros = calories.training && personal.weight && goals.primary && personal.trainingLevel
    ? calculateMacros(calories.training, personal.weight, goals.primary, personal.trainingLevel)
    : { protein: 0, carbs: 0, fat: 0 }

  const age = personal.birthDate ? calculateAge(personal.birthDate) : 0

  return (
    <div className="max-w-md mx-auto space-y-6">
      <motion.div {...fadeInUp} className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-white" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold text-dark-gray-primary mb-2">
          Profil-Zusammenfassung
        </h2>
        <p className="text-dark-gray-tertiary">
          Dein personalisiertes Fitness-Profil ist bereit!
        </p>
      </motion.div>

      <motion.div {...fadeInUp} className="space-y-4">
        {/* Personal Overview */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-500" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-semibold text-dark-gray-primary">Persönliche Daten</h3>
              <p className="text-sm text-dark-gray-tertiary">Deine Basisdaten</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-dark-gray-tertiary">Name:</span>
              <span className="text-dark-gray-primary font-medium">{personal.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-gray-tertiary">Alter:</span>
              <span className="text-dark-gray-primary font-medium">{age} Jahre</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-gray-tertiary">Größe/Gewicht:</span>
              <span className="text-dark-gray-primary font-medium">{personal.height}cm / {personal.weight}kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-gray-tertiary">Trainingslevel:</span>
              <span className="text-dark-gray-primary font-medium capitalize">{personal.trainingLevel}</span>
            </div>
          </div>
        </div>

        {/* Goals */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-500" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-semibold text-dark-gray-primary">Ziele</h3>
              <p className="text-sm text-dark-gray-tertiary">Dein Fokus</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-dark-gray-tertiary">Primäres Ziel:</span>
              <span className="text-dark-gray-primary font-medium capitalize">
                {goals.primary?.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-gray-tertiary">Training/Woche:</span>
              <span className="text-dark-gray-primary font-medium">{activity.weeklyTrainingFrequency}x</span>
            </div>
          </div>
        </div>

        {/* Calculated Values */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Calculator className="w-5 h-5 text-green-500" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-semibold text-dark-gray-primary">Berechnete Werte</h3>
              <p className="text-sm text-dark-gray-tertiary">Deine personalisierten Ziele</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-dark-gray-tertiary">Grundumsatz (BMR):</span>
              <span className="text-dark-gray-primary font-medium">{bmr} kcal</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-gray-tertiary">Gesamtumsatz (TDEE):</span>
              <span className="text-dark-gray-primary font-medium">{tdee} kcal</span>
            </div>
            <hr className="border-dark-quaternary" />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-dark-gray-tertiary">Trainingstag:</span>
                <span className="text-green-400 font-medium">{calories.training} kcal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-gray-tertiary">Ruhetag:</span>
                <span className="text-blue-400 font-medium">{calories.rest} kcal</span>
              </div>
            </div>
            <hr className="border-dark-quaternary" />
            <div className="space-y-1">
              <div className="text-sm font-medium text-dark-gray-primary mb-2">Makro-Verteilung (Trainingstag):</div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-gray-tertiary">Protein:</span>
                <span className="text-red-400 font-medium">{macros.protein}g</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-gray-tertiary">Kohlenhydrate:</span>
                <span className="text-yellow-400 font-medium">{macros.carbs}g</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-gray-tertiary">Fett:</span>
                <span className="text-blue-400 font-medium">{macros.fat}g</span>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <motion.div 
          {...fadeInUp}
          className="text-center p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/20"
        >
          <div className="text-2xl mb-2">🎉</div>
          <h3 className="font-semibold text-dark-gray-primary mb-1">
            Perfekt! Dein Profil ist bereit.
          </h3>
          <p className="text-sm text-dark-gray-tertiary">
            Klicke auf "Profil erstellen" um mit der intelligenten Tagesplanung zu beginnen.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
} 