import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Calculator, Target, CheckCircle, Loader2, Copy, Check, MessageSquare } from 'lucide-react'
import { useState, useEffect } from 'react'
import React from 'react'
import { useSimpleOnboarding } from '../../hooks/useSimpleOnboarding'

// Number Input component
interface NumberInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  unit?: string
  placeholder?: string
  disabled?: boolean
}

function NumberInput({ label, value, onChange, min, max, unit = '', placeholder, disabled = false }: NumberInputProps) {
  const [localValue, setLocalValue] = useState(value.toString())

  // Sync with external value changes
  React.useEffect(() => {
    setLocalValue(value.toString())
  }, [value])

  const handleBlur = () => {
    const numValue = Number(localValue)
    if (!isNaN(numValue)) {
      let clampedValue = numValue
      if (min !== undefined) clampedValue = Math.max(min, clampedValue)
      if (max !== undefined) clampedValue = Math.min(max, clampedValue)
      onChange(clampedValue)
      setLocalValue(clampedValue.toString())
    } else {
      // Reset to current value if invalid
      setLocalValue(value.toString())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur()
      ;(e.target as HTMLInputElement).blur()
    }
  }

  return (
    <div className={`space-y-3 ${disabled ? 'opacity-60' : ''}`}>
      <label className="block text-sm font-medium text-white">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="input text-center text-xl font-semibold"
        />
        {unit && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-dark-gray-tertiary text-sm">
            {unit}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SimpleOnboardingFlow() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showBMRPrompt, setShowBMRPrompt] = useState(false)
  const [showMacroPrompt, setShowMacroPrompt] = useState(false)
  const [copiedBMR, setCopiedBMR] = useState(false)
  const [copiedMacro, setCopiedMacro] = useState(false)
  
  // Local state for sliders to prevent unfocus bug
  const [localBMR, setLocalBMR] = useState(1500)
  const [localTraining, setLocalTraining] = useState({
    kcal: 2000, protein: 120, carbs: 200, fat: 80
  })
  const [localRest, setLocalRest] = useState({
    kcal: 1800, protein: 100, carbs: 150, fat: 70
  })
  
  const {
    state,
    currentStep,
    totalSteps,
    progress,
    updateBMR,
    updateTrainingMacros,
    updateRestMacros,
    nextStep,
    previousStep,
    isStepValid,
    saveProfile
  } = useSimpleOnboarding()

  // Initialize local state from global state
  useEffect(() => {
    if (state.bmr && state.bmr !== localBMR) {
      setLocalBMR(state.bmr)
    }
    if (state.training.kcal && state.training.kcal !== localTraining.kcal) {
      setLocalTraining({
        kcal: typeof state.training.kcal === 'number' ? state.training.kcal : 2000,
        protein: typeof state.training.protein === 'number' ? state.training.protein : 120,
        carbs: typeof state.training.carbs === 'number' ? state.training.carbs : 200,
        fat: typeof state.training.fat === 'number' ? state.training.fat : 80
      })
    }
    if (state.rest.kcal && state.rest.kcal !== localRest.kcal) {
      setLocalRest({
        kcal: typeof state.rest.kcal === 'number' ? state.rest.kcal : 1800,
        protein: typeof state.rest.protein === 'number' ? state.rest.protein : 100,
        carbs: typeof state.rest.carbs === 'number' ? state.rest.carbs : 150,
        fat: typeof state.rest.fat === 'number' ? state.rest.fat : 70
      })
    }
  }, [state])

  const bmrPrompt = `Ich möchte, dass du mir dabei hilfst, meinen **möglichst genauen Grundumsatz (BMR)** in Kilokalorien zu berechnen und mir eine passende Ernährungsstrategie zu empfehlen.

Bitte stelle mir folgende Fragen:
1. Alter
2. Biologisches Geschlecht  
3. Körpergröße (in cm)
4. Körpergewicht (in kg)
5. Eine grobe Beschreibung meines Körpers (z. B. sportlich, schlank, muskulös, übergewichtig, skinny fat etc.)
6. Falls ich meinen Körperfettanteil (KFA) kenne, frage danach. Wenn ich ihn nicht kenne, schätze ihn bitte selbstständig auf Basis meiner Beschreibung.
7. Meine Trainingserfahrung (Anfänger, Fortgeschritten, Erfahren)
8. Mein primäres Ziel (Fett verlieren, Muskeln aufbauen, beides gleichzeitig, Leistung steigern)

**Schritt 1: BMR berechnen**
Berechne meinen **Grundumsatz (BMR)** mit der passenden Formel:
- Wenn KFA bekannt oder geschätzt → Katch-McArdle
- Sonst → Mifflin-St Jeor

**Schritt 2: Strategie empfehlen**
Basierend auf meinen Daten empfiehl mir eine der folgenden Strategien:
- **Cut** (Fettabbau mit Kaloriendefizit)
- **Lean Bulk** (Langsamer Muskelaufbau mit leichtem Überschuss)
- **Body Recomposition** (Gleichzeitig Fett abbauen und Muskeln aufbauen)
- **Clean Bulk** (Aggressiver Muskelaufbau)

Erkläre kurz deine Wahl und nenne mir:
1. **Meinen BMR:** _____ kcal
2. **Empfohlene Strategie:** _____ 
3. **Kurze Begründung:** _____

Diese Informationen brauche ich für die weitere Makro-Planung.`

  const macroPrompt = `Basierend auf meinem bereits berechneten Grundumsatz von ${state.bmr} kcal und der empfohlenen Strategie, erstelle mir bitte präzise Makronährstoff-Ziele für verschiedene Tagestypen.

🎯 **Mein BMR:** ${state.bmr} kcal
📋 **Empfohlene Strategie:** [Trage hier deine Strategie aus dem ersten Prompt ein: Cut/Lean Bulk/Body Recomp/Clean Bulk]

**WICHTIG: Stelle mir zunächst folgende Fragen für eine präzise Berechnung:**

1. **Trainingsfrequenz:** Wie oft trainiere ich pro Woche? (z.B. 3x, 4x, 5x)
2. **Trainingsart:** Welche Art von Training? (Krafttraining, Cardio, beides)
3. **Trainingsdauer:** Wie lange dauert eine typische Trainingseinheit? (z.B. 60-90 Min)
4. **Berufliche Aktivität:** Bürojob, stehend/gehend, oder körperlich aktiv?
5. **Tägliche Schritte:** Durchschnittliche Schritte pro Tag? (z.B. 8000)
6. **Schlafqualität:** Gut (7-8h) oder problematisch?
7. **Stress-Level:** Niedrig, mittel oder hoch?

**Nach meinen Antworten berechne EXAKT:**

**1. Trainingstag** 🏋️‍♂️
- Gesamtkalorien: _____ kcal
- Protein: _____ g (_____ kcal)
- Kohlenhydrate: _____ g (_____ kcal)  
- Fett: _____ g (_____ kcal)

**2. Ruhetag** 🛋️
- Gesamtkalorien: _____ kcal
- Protein: _____ g (_____ kcal)
- Kohlenhydrate: _____ g (_____ kcal)
- Fett: _____ g (_____ kcal)

**3. Fastentag** ⛔️
- Gesamtkalorien: 0 kcal
- Protein: 0 g
- Kohlenhydrate: 0 g
- Fett: 0 g

**ANTWORT-FORMAT:**
- Antworte NUR mit den konkreten Zahlen
- KEINE langen Erklärungen oder Zusatztipps
- Die Kalorien müssen zu 100% stimmen (Protein×4 + Carbs×4 + Fett×9 = Gesamtkalorien)
- Formatiere die Antwort EXAKT wie oben gezeigt

Gib mir die finalen Werte in genau diesem Format zurück, damit ich sie direkt in meine App eintragen kann.`

  const copyToClipboard = async (text: string, type: 'bmr' | 'macro') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'bmr') {
        setCopiedBMR(true)
        setTimeout(() => setCopiedBMR(false), 2000)
      } else {
        setCopiedMacro(true)
        setTimeout(() => setCopiedMacro(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleNext = async () => {
    // Save all local values to global state before proceeding
    if (currentStep === 0) {
      updateBMR(localBMR)
    } else if (currentStep === 1) {
      updateTrainingMacros(localTraining)
      updateRestMacros(localRest)
    }

    if (currentStep === totalSteps - 1) {
      // Final step - save profile with current local values
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate saving
        // Pass local values directly to avoid state update timing issues
        console.log('🔧 Saving profile with values:', { localBMR, localTraining, localRest })
        saveProfile(localBMR, localTraining, localRest)
        setShowSuccess(true)
        setTimeout(() => {
          navigate('/dashboard')
        }, 1500)
      } catch (error) {
        console.error('Failed to save profile:', error)
        setIsLoading(false)
      }
    } else {
      nextStep()
    }
  }

  const isCurrentStepValid = () => {
    if (currentStep === 0) {
      return localBMR > 0
    } else if (currentStep === 1) {
      return localTraining.kcal > 0 && localRest.kcal > 0
    }
    return true
  }

  const handlePrevious = () => {
    if (currentStep === 0) {
      navigate('/')
    } else {
      previousStep()
    }
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center px-6">
        <motion.div
          className="text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.div
            className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4, ease: [0.68, -0.55, 0.265, 1.55] }}
          >
            <CheckCircle className="w-10 h-10 text-white" strokeWidth={2} />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Profil erstellt!</h2>
          <p className="text-dark-gray-tertiary">Du wirst zur App weitergeleitet...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-primary safe-area">
      {/* Header */}
      <header className="px-6 py-4 bg-dark-primary/95 backdrop-blur-apple">
        <div className="flex items-center gap-4 mb-6">
          <motion.button
            onClick={handlePrevious}
            className="w-10 h-10 rounded-xl bg-dark-tertiary flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
          >
            <ChevronLeft className="w-5 h-5 text-dark-gray-primary" strokeWidth={2} />
          </motion.button>

          <div className="flex-1">
            <h1 className="text-lg font-semibold text-dark-gray-primary">
              {currentStep === 0 ? 'Grundumsatz' : 'Makro-Ziele'}
            </h1>
            <p className="text-sm text-dark-gray-tertiary">
              Schritt {currentStep + 1} von {totalSteps}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-dark-tertiary rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 px-6 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            {...fadeInUp}
            className="max-w-md mx-auto"
          >
            {currentStep === 0 ? <BMRStep /> : <MacroGoalsStep />}
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
            {currentStep === 0 ? 'Zurück' : 'Zurück'}
          </motion.button>

          <motion.button
            onClick={handleNext}
            disabled={!isCurrentStepValid() || isLoading}
            className="flex-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            whileTap={{ scale: isCurrentStepValid() && !isLoading ? 0.98 : 1 }}
            transition={{ duration: 0.1 }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Speichere...
              </>
            ) : (
              <>
                {currentStep === totalSteps - 1 ? 'Profil erstellen' : 'Weiter'}
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* BMR Prompt Modal */}
      <AnimatePresence>
        {showBMRPrompt && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBMRPrompt(false)}
          >
            <motion.div
              className="bg-dark-secondary rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-green-500" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">ChatGPT Prompt</h3>
                  <p className="text-sm text-dark-gray-tertiary">Kopiere und verwende in ChatGPT</p>
                </div>
              </div>

              <div className="bg-dark-tertiary rounded-xl p-4 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                <pre className="text-sm text-dark-gray-primary whitespace-pre-wrap font-mono leading-relaxed">
                  {bmrPrompt}
                </pre>
              </div>

              <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowBMRPrompt(false)}
                  className="flex-1 btn-secondary"
                  whileTap={{ scale: 0.98 }}
                >
                  Schließen
                </motion.button>
                <motion.button
                  onClick={() => copyToClipboard(bmrPrompt, 'bmr')}
                  className="flex-2 btn-primary flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.98 }}
                >
                  {copiedBMR ? (
                    <>
                      <Check className="w-4 h-4" strokeWidth={2} />
                      Kopiert!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" strokeWidth={2} />
                      Prompt kopieren
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Macro Prompt Modal */}
      <AnimatePresence>
        {showMacroPrompt && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMacroPrompt(false)}
          >
            <motion.div
              className="bg-dark-secondary rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-500" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Makro-Berechnung</h3>
                  <p className="text-sm text-dark-gray-tertiary">Kopiere und verwende in ChatGPT</p>
                </div>
              </div>

              <div className="bg-dark-tertiary rounded-xl p-4 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                <pre className="text-sm text-dark-gray-primary whitespace-pre-wrap font-mono leading-relaxed">
                  {macroPrompt}
                </pre>
              </div>

              <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowMacroPrompt(false)}
                  className="flex-1 btn-secondary"
                  whileTap={{ scale: 0.98 }}
                >
                  Schließen
                </motion.button>
                <motion.button
                  onClick={() => copyToClipboard(macroPrompt, 'macro')}
                  className="flex-2 btn-primary flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.98 }}
                >
                  {copiedMacro ? (
                    <>
                      <Check className="w-4 h-4" strokeWidth={2} />
                      Kopiert!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" strokeWidth={2} />
                      Prompt kopieren
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  function BMRStep() {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calculator className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Dein Grundumsatz
          </h2>
          <p className="text-dark-gray-tertiary text-balance">
            Lass ChatGPT deinen BMR berechnen und stelle den Wert hier ein.
          </p>
        </div>

        <div className="space-y-6">
          {/* ChatGPT Button */}
          <motion.button
            onClick={() => setShowBMRPrompt(true)}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-3 flex items-center justify-center gap-2 shadow-apple text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <MessageSquare className="w-4 h-4 text-white" strokeWidth={1.5} />
            <span className="text-white font-medium">ChatGPT Prompt kopieren</span>
          </motion.button>

          <div className="bg-dark-secondary/50 rounded-xl p-3 border border-dark-quaternary/30">
            <p className="text-xs text-dark-gray-tertiary text-center">
              💡 Kopiere den Prompt, füge ihn in ChatGPT ein und folge den Anweisungen.
            </p>
          </div>

          {/* BMR Slider */}
          <div className="card">
            <NumberInput
              label="Grundumsatz"
              value={localBMR}
              onChange={(value) => setLocalBMR(value)}
              min={1000}
              max={3000}
              unit=" kcal"
            />
          </div>
        </div>
      </div>
    )
  }

  function MacroGoalsStep() {
    const dayTypes = [
      {
        type: 'training',
        label: 'Trainingstag',
        emoji: '🏋️‍♂️',
        description: 'Mehr Kalorien für optimale Performance',
        data: localTraining,
        update: (updates: Partial<typeof localTraining>) => setLocalTraining(prev => ({ ...prev, ...updates })),
        color: 'from-green-500 to-green-600'
      },
      {
        type: 'rest',
        label: 'Ruhetag',
        emoji: '🛋️',
        description: 'Moderate Kalorien für Regeneration',
        data: localRest,
        update: (updates: Partial<typeof localRest>) => setLocalRest(prev => ({ ...prev, ...updates })),
        color: 'from-blue-500 to-blue-600'
      },
      {
        type: 'fasting',
        label: 'Fastentag',
        emoji: '⛔️',
        description: 'Alle Werte sind 0 (Fasten)',
        data: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
        update: () => {}, // Read-only
        readonly: true,
        color: 'from-gray-500 to-gray-600'
      }
    ]

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Makro-Ziele
          </h2>
          <p className="text-dark-gray-tertiary text-balance">
            Lass ChatGPT deine optimalen Makros berechnen.
          </p>
        </div>

        <div className="space-y-4">
          {/* ChatGPT Button for Macros */}
          {localBMR > 0 && (
            <motion.button
              onClick={() => setShowMacroPrompt(true)}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-3 flex items-center justify-center gap-2 shadow-apple text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Target className="w-4 h-4 text-white" strokeWidth={1.5} />
              <span className="text-white font-medium">Makro-Prompt kopieren</span>
            </motion.button>
          )}

          {dayTypes.map((dayType, index) => (
            <motion.div
              key={dayType.type}
              className={`card ${dayType.readonly ? 'opacity-60' : ''}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${dayType.color} flex items-center justify-center`}>
                  <span className="text-2xl">{dayType.emoji}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">{dayType.label}</h3>
                  <p className="text-sm text-dark-gray-tertiary">{dayType.description}</p>
                </div>
              </div>

              {/* Macro Sliders */}
              <div className="space-y-6">
                {/* Kalorien */}
                <NumberInput
                  label="Gesamtkalorien"
                  value={typeof dayType.data.kcal === 'number' ? dayType.data.kcal : 2000}
                  onChange={(value) => dayType.update({ kcal: value })}
                  min={1000}
                  max={4000}
                  unit=" kcal"
                  disabled={dayType.readonly}
                />

                {/* Protein */}
                <NumberInput
                  label="Protein"
                  value={typeof dayType.data.protein === 'number' ? dayType.data.protein : 120}
                  onChange={(value) => dayType.update({ protein: value })}
                  min={50}
                  max={300}
                  unit="g"
                  disabled={dayType.readonly}
                />

                {/* Kohlenhydrate */}
                <NumberInput
                  label="Kohlenhydrate"
                  value={typeof dayType.data.carbs === 'number' ? dayType.data.carbs : 200}
                  onChange={(value) => dayType.update({ carbs: value })}
                  min={0}
                  max={500}
                  unit="g"
                  disabled={dayType.readonly}
                />

                {/* Fett */}
                <NumberInput
                  label="Fett"
                  value={typeof dayType.data.fat === 'number' ? dayType.data.fat : 80}
                  onChange={(value) => dayType.update({ fat: value })}
                  min={20}
                  max={200}
                  unit="g"
                  disabled={dayType.readonly}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }
} 