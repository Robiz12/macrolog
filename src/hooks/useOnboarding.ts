import { useState, useCallback, useEffect } from 'react'
import { UserProfile, PersonalData, Goals, ActivityLevel, TrainingDetails, DietStrategy } from '../types'
import { useLocalStorage } from './useLocalStorage'
import { 
  calculateBMRWithBodyFat, 
  calculateTDEE, 
  calculateTargetCalories, 
  calculateMacros 
} from '../utils/calculations'

export interface OnboardingState {
  currentStep: number
  personal: Partial<PersonalData>
  goals: Partial<Goals>
  activity: Partial<ActivityLevel>
  training: Partial<TrainingDetails>
  diet: Partial<DietStrategy>
}

const initialState: OnboardingState = {
  currentStep: 0,
  personal: {},
  goals: {},
  activity: {},
  training: {},
  diet: {}
}

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(initialState)
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile | null>('userProfile', null)
  const [hasOnboarded, setHasOnboarded] = useLocalStorage('hasOnboarded', false)

  const totalSteps = 6 // Number of onboarding steps

  const updatePersonalData = useCallback((data: Partial<PersonalData>) => {
    setState(prev => ({
      ...prev,
      personal: { ...prev.personal, ...data }
    }))
  }, [])

  const updateGoals = useCallback((data: Partial<Goals>) => {
    setState(prev => ({
      ...prev,
      goals: { ...prev.goals, ...data }
    }))
  }, [])

  const updateActivity = useCallback((data: Partial<ActivityLevel>) => {
    setState(prev => ({
      ...prev,
      activity: { ...prev.activity, ...data }
    }))
  }, [])

  const updateTraining = useCallback((data: Partial<TrainingDetails>) => {
    setState(prev => ({
      ...prev,
      training: { ...prev.training, ...data }
    }))
  }, [])

  const updateDiet = useCallback((data: Partial<DietStrategy>) => {
    setState(prev => ({
      ...prev,
      diet: { ...prev.diet, ...data }
    }))
  }, [])

  const nextStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, totalSteps - 1)
    }))
  }, [totalSteps])

  const previousStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0)
    }))
  }, [])

  const goToStep = useCallback((step: number) => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(0, Math.min(step, totalSteps - 1))
    }))
  }, [totalSteps])

  const calculateAndSaveProfile = useCallback(() => {
    const { personal, goals, activity, training, diet } = state

    // Validate required data
    if (!personal.name || !personal.gender || !personal.birthDate || 
        !personal.height || !personal.weight || !personal.trainingLevel ||
        !goals.primary || !activity.occupation || !activity.weeklyTrainingFrequency ||
        !training.sessionDuration || !training.preferredTime || !training.intensity) {
      throw new Error('Incomplete onboarding data')
    }

    // Calculate values
    const bmr = calculateBMRWithBodyFat(personal as PersonalData)
    const tdee = calculateTDEE(bmr, activity as ActivityLevel, training as TrainingDetails)
    const calories = calculateTargetCalories(tdee, goals.primary)
    const macros = calculateMacros(
      calories.training, 
      personal.weight, 
      goals.primary, 
      personal.trainingLevel
    )

    const profile: UserProfile = {
      personal: personal as PersonalData,
      goals: goals as Goals,
      activity: activity as ActivityLevel,
      training: training as TrainingDetails,
      diet: diet as DietStrategy,
      calculatedValues: {
        bmr,
        tdee,
        calories,
        macros
      }
    }

    setUserProfile(profile)
    setHasOnboarded(true)
    
    return profile
  }, [state, setUserProfile, setHasOnboarded])

  const resetOnboarding = useCallback(() => {
    setState(initialState)
    setUserProfile(null)
    setHasOnboarded(false)
  }, [setUserProfile, setHasOnboarded])

  const isStepValid = useCallback((step: number): boolean => {
    switch (step) {
      case 0: // Personal data
        return !!(state.personal.name && state.personal.gender && state.personal.birthDate &&
                 state.personal.height && state.personal.weight && state.personal.trainingLevel)
      case 1: // Goals
        return !!(state.goals.primary && state.goals.targetAreas?.length)
      case 2: // Activity
        return !!(state.activity.occupation && state.activity.dailySteps !== undefined &&
                 state.activity.weeklyTrainingFrequency && state.activity.trainingSplit)
      case 3: // Training
        return !!(state.training.sessionDuration && state.training.preferredTime &&
                 state.training.intensity && state.training.focusRatio)
      case 4: // Diet
        return !!(state.diet.dayTypes && state.diet.customMacros !== undefined)
      case 5: // Summary
        return true
      default:
        return false
    }
  }, [state])

  const progress = (state.currentStep + 1) / totalSteps * 100

  return {
    // State
    state,
    userProfile,
    hasOnboarded,
    currentStep: state.currentStep,
    totalSteps,
    progress,

    // Actions
    updatePersonalData,
    updateGoals,
    updateActivity,
    updateTraining,
    updateDiet,
    nextStep,
    previousStep,
    goToStep,
    calculateAndSaveProfile,
    resetOnboarding,
    isStepValid
  }
} 