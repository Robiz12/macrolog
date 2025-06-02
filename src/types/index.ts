// Simplified types for streamlined onboarding
export interface MacroGoals {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

// Input version that allows strings during editing
export interface MacroGoalsInput {
  kcal?: number | string
  protein?: number | string
  carbs?: number | string
  fat?: number | string
}

export interface UserMacros {
  bmr: number
  training: MacroGoals
  rest: MacroGoals
  fasting: MacroGoals // Always zeros, read-only
}

export interface OnboardingState {
  currentStep: number
  bmr: number
  training: MacroGoalsInput
  rest: MacroGoalsInput
  isComplete: boolean
}

// Legacy types for backward compatibility (can be removed later)
export interface PersonalData {
  name: string
  gender: 'male' | 'female' | 'diverse'
  birthDate: string
  height: number // cm
  weight: number // kg
  bodyFatPercentage?: number // %
  trainingLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

export interface Goals {
  primary: 'fat_loss' | 'recomposition' | 'muscle_gain' | 'performance' | 'health'
  targetAreas: ('abs' | 'hips' | 'chest' | 'thighs' | 'general')[]
}

export interface ActivityLevel {
  occupation: 'office' | 'standing' | 'physical'
  dailySteps: number
  weeklyTrainingFrequency: number
  trainingSplit: 'push_pull' | 'full_body' | 'ppl' | 'custom'
  customSplit?: string
}

export interface TrainingDetails {
  sessionDuration: number // minutes
  preferredTime: 'morning' | 'noon' | 'evening' | 'flexible'
  intensity: number // 1-10 scale
  focusRatio: {
    strength: number // 0-100
    hypertrophy: number // 0-100
  }
}

export interface DietStrategy {
  dayTypes: {
    training: boolean
    rest: boolean
    fasting: boolean
    refeed: boolean
  }
  customMacros: boolean
  fastingSupplements: ('yohimbine' | 'rauwolscine')[]
  supplements: string[]
}

export interface UserProfile {
  personal: PersonalData
  goals: Goals
  activity: ActivityLevel
  training: TrainingDetails
  diet: DietStrategy
  calculatedValues?: {
    bmr: number // Basal Metabolic Rate
    tdee: number // Total Daily Energy Expenditure
    calories: {
      training: number
      rest: number
      fasting: number
    }
    macros: {
      protein: number // grams
      carbs: number // grams  
      fat: number // grams
    }
  }
}

export interface MealTemplate {
  id: string
  name: string
  time: string
  calories: number
  macros: {
    protein: number
    carbs: number
    fat: number
  }
  suggestions: string[]
}

export interface DayPlan {
  id: string
  date: string
  type: 'training' | 'rest' | 'fasting' | 'refeed'
  calories: number
  macros: {
    protein: number
    carbs: number
    fat: number
  }
  meals: MealTemplate[]
  training?: {
    type: string
    duration: number
    time: string
  }
} 