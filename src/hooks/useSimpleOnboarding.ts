import { useState, useCallback } from 'react'
import { OnboardingState, UserMacros, MacroGoals, MacroGoalsInput } from '../types'
import { useLocalStorage } from './useLocalStorage'

const initialState: OnboardingState = {
  currentStep: 0,
  bmr: 0,
  training: {},
  rest: {},
  isComplete: false
}

export function useSimpleOnboarding() {
  const [state, setState] = useState<OnboardingState>(initialState)
  const [userMacros, setUserMacros] = useLocalStorage<UserMacros | null>('userMacros', null)
  const [hasOnboarded, setHasOnboarded] = useLocalStorage('hasOnboarded', false)

  const totalSteps = 2 // BMR + Macro Goals

  const updateBMR = useCallback((value: string | number) => {
    setState(prev => ({ ...prev, bmr: typeof value === 'string' ? (value === '' ? 0 : Number(value)) : value }))
  }, [])

  const updateTrainingMacros = useCallback((macros: MacroGoalsInput) => {
    setState(prev => ({
      ...prev,
      training: { ...prev.training, ...macros }
    }))
  }, [])

  const updateRestMacros = useCallback((macros: MacroGoalsInput) => {
    setState(prev => ({
      ...prev,
      rest: { ...prev.rest, ...macros }
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

  const isStepValid = useCallback((step: number): boolean => {
    switch (step) {
      case 0: // BMR
        return state.bmr > 0
      case 1: // Macro goals
        const hasValidTraining = !!(
          (state.training.kcal && Number(state.training.kcal) > 0) && 
          (state.training.protein && Number(state.training.protein) > 0) && 
          (state.training.carbs !== undefined && Number(state.training.carbs) >= 0) && 
          (state.training.fat && Number(state.training.fat) > 0)
        )
        const hasValidRest = !!(
          (state.rest.kcal && Number(state.rest.kcal) > 0) && 
          (state.rest.protein && Number(state.rest.protein) > 0) && 
          (state.rest.carbs !== undefined && Number(state.rest.carbs) >= 0) && 
          (state.rest.fat && Number(state.rest.fat) > 0)
        )
        return hasValidTraining && hasValidRest
      default:
        return false
    }
  }, [state])

  const saveProfile = useCallback((
    overrideBMR?: number,
    overrideTraining?: MacroGoalsInput,
    overrideRest?: MacroGoalsInput
  ) => {
    // Use provided values or fall back to state
    const bmrValue = overrideBMR ?? state.bmr
    const trainingValue = overrideTraining ?? state.training
    const restValue = overrideRest ?? state.rest

    // Validate with current/provided values
    const isBMRValid = bmrValue > 0
    const hasValidTraining = !!(
      (trainingValue.kcal && Number(trainingValue.kcal) > 0) && 
      (trainingValue.protein && Number(trainingValue.protein) > 0) && 
      (trainingValue.carbs !== undefined && Number(trainingValue.carbs) >= 0) && 
      (trainingValue.fat && Number(trainingValue.fat) > 0)
    )
    const hasValidRest = !!(
      (restValue.kcal && Number(restValue.kcal) > 0) && 
      (restValue.protein && Number(restValue.protein) > 0) && 
      (restValue.carbs !== undefined && Number(restValue.carbs) >= 0) && 
      (restValue.fat && Number(restValue.fat) > 0)
    )

    if (!isBMRValid || !hasValidTraining || !hasValidRest) {
      console.error('Validation failed:', {
        isBMRValid,
        hasValidTraining,
        hasValidRest,
        bmrValue,
        trainingValue,
        restValue
      })
      throw new Error('Incomplete onboarding data')
    }

    // Convert strings to numbers for final profile
    const convertToMacroGoals = (input: MacroGoalsInput): MacroGoals => ({
      kcal: typeof input.kcal === 'string' ? Number(input.kcal) : input.kcal || 0,
      protein: typeof input.protein === 'string' ? Number(input.protein) : input.protein || 0,
      carbs: typeof input.carbs === 'string' ? Number(input.carbs) : input.carbs || 0,
      fat: typeof input.fat === 'string' ? Number(input.fat) : input.fat || 0,
    })

    const profile: UserMacros = {
      bmr: bmrValue,
      training: convertToMacroGoals(trainingValue),
      rest: convertToMacroGoals(restValue),
      fasting: { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    }

    setUserMacros(profile)
    setHasOnboarded(true)
    setState(prev => ({ ...prev, isComplete: true }))
    
    return profile
  }, [state, setUserMacros, setHasOnboarded])

  const resetOnboarding = useCallback(() => {
    setState(initialState)
    setUserMacros(null)
    setHasOnboarded(false)
  }, [setUserMacros, setHasOnboarded])

  const progress = ((state.currentStep + 1) / totalSteps) * 100

  return {
    // State
    state,
    userMacros,
    hasOnboarded,
    currentStep: state.currentStep,
    totalSteps,
    progress,

    // Actions
    updateBMR,
    updateTrainingMacros,
    updateRestMacros,
    nextStep,
    previousStep,
    goToStep,
    isStepValid,
    saveProfile,
    resetOnboarding
  }
} 