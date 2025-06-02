import { PersonalData, Goals, ActivityLevel, TrainingDetails } from '../types'

/**
 * Calculate BMR using Mifflin-St Jeor formula
 */
export function calculateBMR(personal: PersonalData): number {
  const age = calculateAge(personal.birthDate)
  
  // Mifflin-St Jeor formula
  let bmr: number
  
  if (personal.gender === 'male') {
    bmr = 10 * personal.weight + 6.25 * personal.height - 5 * age + 5
  } else {
    bmr = 10 * personal.weight + 6.25 * personal.height - 5 * age - 161
  }
  
  return Math.round(bmr)
}

/**
 * Calculate BMR using Katch-McArdle formula (more accurate when body fat is known)
 */
export function calculateBMRWithBodyFat(personal: PersonalData): number {
  if (!personal.bodyFatPercentage) {
    return calculateBMR(personal)
  }
  
  const leanBodyMass = personal.weight * (1 - personal.bodyFatPercentage / 100)
  const bmr = 370 + (21.6 * leanBodyMass)
  
  return Math.round(bmr)
}

/**
 * Calculate TDEE based on activity level and training
 */
export function calculateTDEE(
  bmr: number, 
  activity: ActivityLevel, 
  training: TrainingDetails
): number {
  // Base activity multiplier
  let activityMultiplier: number
  
  switch (activity.occupation) {
    case 'office':
      activityMultiplier = 1.2
      break
    case 'standing':
      activityMultiplier = 1.375
      break
    case 'physical':
      activityMultiplier = 1.55
      break
    default:
      activityMultiplier = 1.2
  }
  
  // Adjust for steps
  if (activity.dailySteps > 10000) {
    activityMultiplier += 0.1
  } else if (activity.dailySteps > 7500) {
    activityMultiplier += 0.05
  }
  
  // Adjust for training frequency and intensity
  const trainingBonus = (activity.weeklyTrainingFrequency * training.intensity * 0.01)
  activityMultiplier += trainingBonus
  
  const tdee = bmr * activityMultiplier
  
  return Math.round(tdee)
}

/**
 * Calculate target calories based on goals
 */
export function calculateTargetCalories(tdee: number, goal: Goals['primary']) {
  let trainingCalories: number
  let restCalories: number
  
  switch (goal) {
    case 'fat_loss':
      trainingCalories = Math.round(tdee * 0.85) // 15% deficit on training days
      restCalories = Math.round(tdee * 0.75) // 25% deficit on rest days
      break
    case 'recomposition':
      trainingCalories = Math.round(tdee * 1.05) // Slight surplus on training
      restCalories = Math.round(tdee * 0.9) // Deficit on rest days
      break
    case 'muscle_gain':
      trainingCalories = Math.round(tdee * 1.15) // 15% surplus on training
      restCalories = Math.round(tdee * 1.05) // 5% surplus on rest
      break
    case 'performance':
      trainingCalories = Math.round(tdee * 1.1)
      restCalories = Math.round(tdee)
      break
    case 'health':
      trainingCalories = Math.round(tdee)
      restCalories = Math.round(tdee * 0.95)
      break
    default:
      trainingCalories = tdee
      restCalories = tdee
  }
  
  return {
    training: trainingCalories,
    rest: restCalories,
    fasting: 0
  }
}

/**
 * Calculate optimal macro distribution
 */
export function calculateMacros(
  calories: number, 
  weight: number, 
  goal: Goals['primary'],
  trainingLevel: PersonalData['trainingLevel']
) {
  let proteinRatio: number
  let fatRatio: number
  
  // Protein requirements based on goal and training level
  switch (goal) {
    case 'muscle_gain':
      proteinRatio = trainingLevel === 'expert' ? 2.4 : 2.2
      break
    case 'fat_loss':
      proteinRatio = 2.5 // Higher protein during cut
      break
    case 'recomposition':
      proteinRatio = 2.3
      break
    default:
      proteinRatio = 2.0
  }
  
  // Fat requirements (minimum for hormone production)
  fatRatio = goal === 'fat_loss' ? 0.8 : 1.0
  
  const protein = Math.round(weight * proteinRatio) // grams
  const fat = Math.round(weight * fatRatio) // grams
  
  // Remaining calories from carbs
  const proteinCalories = protein * 4
  const fatCalories = fat * 9
  const remainingCalories = calories - proteinCalories - fatCalories
  const carbs = Math.round(Math.max(0, remainingCalories / 4))
  
  return {
    protein,
    carbs,
    fat
  }
}

/**
 * Calculate age from birth date
 */
export function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

/**
 * Get activity factor description
 */
export function getActivityDescription(
  occupation: ActivityLevel['occupation'],
  steps: number,
  trainingFreq: number
): string {
  const occupationDesc = {
    office: 'Büroarbeit',
    standing: 'Stehend/Gehend',
    physical: 'Körperlich aktiv'
  }
  
  const stepsDesc = steps > 10000 ? 'Sehr aktiv' : steps > 7500 ? 'Aktiv' : 'Wenig aktiv'
  
  return `${occupationDesc[occupation]} • ${stepsDesc} • ${trainingFreq}x Training/Woche`
}

/**
 * Validate if onboarding data is complete
 */
export function validateOnboardingData(data: Partial<any>): boolean {
  // Add validation logic here
  return true
} 