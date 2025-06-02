import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Target, Activity, Calendar, Settings, X, History, CheckCircle } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import React from 'react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { UserMacros } from '../../types'

interface PlannedDay {
  date: string // YYYY-MM-DD format
  type: 'training' | 'rest' | 'fasting'
  completed: boolean
  trainingTime?: string // HH:MM format for training days
  meals?: Meal[] // Added meals array
  mealPlan?: MealPlan // Meal planning config
  originalMacros?: {
    kcal: number
    protein: number
    carbs: number
    fat: number
  }
  history?: Array<{
    type: 'training' | 'rest' | 'fasting'
    timestamp: string
    completed: boolean
    trainingTime?: string
    originalMacros?: {
      kcal: number
      protein: number
      carbs: number
      fat: number
    }
  }>
}

interface Meal {
  id: string
  name: string
  time?: string // HH:MM format
  suggestedTime?: string // AI suggested time based on training
  relativeToTraining?: string // e.g. "T-3h", "T+1h"
  mealType: 'pre-long' | 'pre-short' | 'post' | 'recovery' | 'regular' | 'break-fast'
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  completed?: boolean
  locked?: boolean // true if eaten and confirmed
  status: 'open' | 'completed' | 'locked'
  warnings?: string[]
}

interface MealPlan {
  eatingWindow: { start: string, end: string } // HH:MM format
  mealCount: number
  trainingTime?: string
  lastUpdated: string
}

// Number Input component (reused from onboarding)
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

export default function Dashboard() {
  const [userMacros, setUserMacros] = useLocalStorage<UserMacros | null>('userMacros', null)
  const [plannedDays, setPlannedDays] = useLocalStorage<PlannedDay[]>('plannedDays', [])
  const [showDayTypeModal, setShowDayTypeModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [viewingDay, setViewingDay] = useState<number>(0) // Currently selected day for viewing
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showEditMacrosModal, setShowEditMacrosModal] = useState(false)

  // Local state for editing macros
  const [editingMacros, setEditingMacros] = useState<UserMacros | null>(null)

  // Meal detail modal state
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null)
  const [showMealModal, setShowMealModal] = useState(false)

  // Get current day of week (0 = Sunday, 1 = Monday, etc.)
  const today = new Date()
  const currentDayOfWeek = today.getDay()
  
  // Convert to Monday = 0, Tuesday = 1, etc.
  const currentDay = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1
  const todayDateStr = today.toISOString().split('T')[0]

  // Auto-complete previous day when day changes
  useEffect(() => {
    const checkAndCompletePreviousDay = () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayDateStr = yesterday.toISOString().split('T')[0]
      
      const yesterdayPlan = plannedDays.find(day => day.date === yesterdayDateStr)
      
      if (yesterdayPlan && !yesterdayPlan.completed) {
        // Auto-complete yesterday
        const updatedPlannedDays = plannedDays.map(day => 
          day.date === yesterdayDateStr 
            ? { ...day, completed: true }
            : day
        )
        setPlannedDays(updatedPlannedDays)
      }
    }

    // Check on component mount and daily
    checkAndCompletePreviousDay()
    
    // Set up interval to check every minute for day change
    const interval = setInterval(() => {
      const currentDate = new Date().toISOString().split('T')[0]
      if (currentDate !== todayDateStr) {
        checkAndCompletePreviousDay()
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [plannedDays, setPlannedDays])

  // Initialize viewing day to current day
  useEffect(() => {
    setViewingDay(currentDay)
  }, [currentDay])

  // Get selected day's plan and data
  const getDateForDay = (dayIndex: number) => {
    const date = new Date()
    date.setDate(date.getDate() - currentDay + dayIndex)
    return date
  }

  const getViewingDayPlan = () => {
    // Only allow viewing current and past days
    if (viewingDay > currentDay) {
      setViewingDay(currentDay)
      return null
    }
    
    const date = getDateForDay(viewingDay)
    const dateStr = date.toISOString().split('T')[0]
    return plannedDays.find(day => day.date === dateStr)
  }

  // Get macro values for a planned day (original for completed, current for incomplete)
  const getMacrosForPlannedDay = (plannedDay: PlannedDay) => {
    // For completed days, ALWAYS use original macros - never use current settings
    if (plannedDay.completed && plannedDay.originalMacros) {
      return plannedDay.originalMacros
    }
    
    // For incomplete days, use current userMacros (these can change with settings)
    if (!plannedDay.completed) {
      // Special case for fasting - always return 0 macros
      if (plannedDay.type === 'fasting') {
        return { kcal: 0, protein: 0, carbs: 0, fat: 0 }
      }
      return userMacros?.[plannedDay.type] || null
    }
    
    // Fallback: if completed but no original macros (shouldn't happen), use current
    if (plannedDay.type === 'fasting') {
      return { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    }
    return userMacros?.[plannedDay.type] || null
  }

  const viewingDayPlan = getViewingDayPlan()
  const viewingDayMacros = viewingDayPlan ? getMacrosForPlannedDay(viewingDayPlan) : null
  const viewingDate = getDateForDay(viewingDay)

  // Get today's planned day (for completion functionality)
  const todayPlan = plannedDays.find(day => day.date === todayDateStr)

  // Default meal templates for different day types
  const getMealTemplates = (dayType: 'training' | 'rest' | 'fasting') => {
    switch (dayType) {
      case 'training':
        return [
          { id: 'breakfast', name: 'Frühstück', time: '08:00' },
          { id: 'lunch', name: 'Mittag', time: '12:30' },
          { id: 'pre-workout', name: 'Pre Workout', time: '16:00' },
          { id: 'post-workout', name: 'Post Workout', time: '19:00' },
          { id: 'dinner', name: 'Abendessen', time: '20:30' }
        ]
      case 'rest':
        return [
          { id: 'breakfast', name: 'Frühstück', time: '09:00' },
          { id: 'lunch', name: 'Mittag', time: '13:00' },
          { id: 'afternoon', name: 'Nachmittag', time: '16:30' },
          { id: 'dinner', name: 'Abendessen', time: '19:30' }
        ]
      case 'fasting':
        return [
          { id: 'break-fast', name: 'Fastenbrechen', time: '16:00' }
        ]
      default:
        return []
    }
  }

  // Initialize meals for a day if they don't exist
  const initializeMealsForDay = (dayPlan: PlannedDay) => {
    if (!dayPlan.meals || dayPlan.meals.length === 0) {
      // Use intelligent meal planning ONLY for training days
      if (dayPlan.type === 'training' && dayPlan.trainingTime) {
        return generateIntelligentMealPlan(dayPlan)
      }
      
      // For rest days and fasting days, use normal templates
      const templates = getMealTemplates(dayPlan.type)
      const initialMeals: Meal[] = templates.map(template => ({
        ...template,
        mealType: dayPlan.type === 'fasting' ? 'break-fast' : 'regular',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        completed: false,
        status: 'open' as const,
        locked: false
      }))
      
      // Update the day with initial meals
      const updatedPlannedDays = plannedDays.map(day => 
        day.date === dayPlan.date 
          ? { ...day, meals: initialMeals }
          : day
      )
      setPlannedDays(updatedPlannedDays)
      
      return initialMeals
    }
    return dayPlan.meals
  }

  // Create timeline with meals and training
  const createMealTimeline = (meals: Meal[], trainingTime?: string) => {
    const timeline: Array<{ type: 'meal' | 'training', data: Meal | { time: string, name: string }, sortTime: number }> = []
    
    // Add meals to timeline
    meals.forEach(meal => {
      if (meal.time) {
        const [hours, minutes] = meal.time.split(':').map(Number)
        const sortTime = hours * 60 + minutes
        timeline.push({ type: 'meal', data: meal, sortTime })
      }
    })
    
    // Add training to timeline if it exists and it's a training day
    if (trainingTime) {
      const [hours, minutes] = trainingTime.split(':').map(Number)
      const sortTime = hours * 60 + minutes
      timeline.push({ 
        type: 'training', 
        data: { time: trainingTime, name: 'Training' }, 
        sortTime 
      })
    }
    
    // Sort by time
    return timeline.sort((a, b) => a.sortTime - b.sortTime)
  }

  // Calculate time relative to training
  const addMinutesToTime = (timeStr: string, minutes: number): string => {
    const [hours, mins] = timeStr.split(':').map(Number)
    const totalMinutes = hours * 60 + mins + minutes
    const newHours = Math.floor(totalMinutes / 60) % 24
    const newMins = totalMinutes % 60
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
  }

  // Generate intelligent meal plan based on training time
  const generateIntelligentMealPlan = (dayPlan: PlannedDay): Meal[] => {
    if (!dayPlan.trainingTime) return []
    
    const trainingTime = dayPlan.trainingTime
    const dayMacros = getMacrosForPlannedDay(dayPlan)
    
    if (!dayMacros) return []
    
    // Calculate meal times relative to training
    const preLongTime = addMinutesToTime(trainingTime, -240) // T-4h
    const preShortTime = addMinutesToTime(trainingTime, -90) // T-1.5h
    const postTime = addMinutesToTime(trainingTime, 60) // T+1h
    const recoveryTime = addMinutesToTime(trainingTime, 180) // T+3h
    
    // Macro distribution for training day
    const totalProtein = dayMacros.protein
    const totalCarbs = dayMacros.carbs
    const totalFat = dayMacros.fat
    const totalCalories = dayMacros.kcal
    
    const meals: Meal[] = [
      {
        id: 'pre-long',
        name: 'Pre-Training (Langsam)',
        time: preLongTime,
        suggestedTime: preLongTime,
        relativeToTraining: 'T-4h',
        mealType: 'pre-long',
        calories: Math.round(totalCalories * 0.25), // 25% of daily calories
        protein: Math.round(totalProtein * 0.25), // 25% of daily protein
        carbs: Math.round(totalCarbs * 0.25), // 25% of daily carbs
        fat: Math.round(totalFat * 0.4), // 40% of daily fat
        status: 'open',
        locked: false,
        completed: false
      },
      {
        id: 'pre-short',
        name: 'Pre-Training (Schnell)',
        time: preShortTime,
        suggestedTime: preShortTime,
        relativeToTraining: 'T-1.5h',
        mealType: 'pre-short',
        calories: Math.round(totalCalories * 0.15), // 15% of daily calories
        protein: Math.round(totalProtein * 0.2), // 20% of daily protein
        carbs: Math.round(totalCarbs * 0.25), // 25% of daily carbs
        fat: Math.round(totalFat * 0.05), // 5% of daily fat (minimal)
        status: 'open',
        locked: false,
        completed: false,
        warnings: totalFat > 5 ? ['Wenig Fett für optimale Aufnahme'] : []
      },
      {
        id: 'post-workout',
        name: 'Post-Training',
        time: postTime,
        suggestedTime: postTime,
        relativeToTraining: 'T+1h',
        mealType: 'post',
        calories: Math.round(totalCalories * 0.3), // 30% of daily calories
        protein: Math.round(totalProtein * 0.3), // 30% of daily protein
        carbs: Math.round(totalCarbs * 0.35), // 35% of daily carbs
        fat: Math.round(totalFat * 0.05), // 5% of daily fat (minimal)
        status: 'open',
        locked: false,
        completed: false,
        warnings: ['MPS-Fenster - nicht auslassen!']
      },
      {
        id: 'recovery',
        name: 'Regeneration/Abendessen',
        time: recoveryTime,
        suggestedTime: recoveryTime,
        relativeToTraining: 'T+3h',
        mealType: 'recovery',
        calories: Math.round(totalCalories * 0.3), // 30% of daily calories
        protein: Math.round(totalProtein * 0.25), // 25% of daily protein
        carbs: Math.round(totalCarbs * 0.15), // 15% of daily carbs
        fat: Math.round(totalFat * 0.5), // 50% of daily fat
        status: 'open',
        locked: false,
        completed: false
      }
    ]
    
    // Update the day with intelligent meals
    const updatedPlannedDays = plannedDays.map(day => 
      day.date === dayPlan.date 
        ? { 
            ...day, 
            meals: meals,
            mealPlan: {
              eatingWindow: { start: preLongTime, end: recoveryTime },
              mealCount: 4,
              trainingTime: trainingTime,
              lastUpdated: new Date().toISOString()
            }
          }
        : day
    )
    setPlannedDays(updatedPlannedDays)
    
    return meals
  }

  const weekDays = [
    { short: 'Mo', full: 'Montag' },
    { short: 'Di', full: 'Dienstag' },
    { short: 'Mi', full: 'Mittwoch' },
    { short: 'Do', full: 'Donnerstag' },
    { short: 'Fr', full: 'Freitag' },
    { short: 'Sa', full: 'Samstag' },
    { short: 'So', full: 'Sonntag' }
  ]

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
  }

  const dayTypes = [
    {
      type: 'training',
      label: 'Trainingstag',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      data: userMacros?.training,
      description: 'Optimale Nährstoffe für dein Training'
    },
    {
      type: 'rest',
      label: 'Ruhetag',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      data: userMacros?.rest,
      description: 'Regeneration und Erholung'
    },
    {
      type: 'fasting',
      label: 'Fastentag',
      color: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-500/10',
      borderColor: 'border-gray-500/30',
      data: { kcal: 0, protein: 0, carbs: 0, fat: 0 }, // Always 0 for fasting
      description: 'Intermittierendes Fasten'
    }
  ] as const

  const handleDayClick = (dayIndex: number) => {
    setSelectedDay(dayIndex)
    setShowDayTypeModal(true)
  }

  const handleDaySelect = (dayIndex: number) => {
    setViewingDay(dayIndex)
  }

  const handleDayTypeSelect = (dayType: { type: 'training' | 'rest' | 'fasting', label: string }) => {
    if (selectedDay === null) return
    
    // Calculate the date for the selected day
    const selectedDate = new Date()
    selectedDate.setDate(selectedDate.getDate() - currentDay + selectedDay)
    const dateStr = selectedDate.toISOString().split('T')[0]
    
    // Find existing plan to preserve history and completion status
    const existingPlan = plannedDays.find(day => day.date === dateStr)
    
    // Get current macro values for this day type
    const currentMacros = dayType.type === 'fasting' 
      ? { kcal: 0, protein: 0, carbs: 0, fat: 0 }
      : userMacros?.[dayType.type]
    
    // Create new plan with history and original macros
    const newPlan: PlannedDay = {
      date: dateStr,
      type: dayType.type,
      completed: existingPlan?.completed || false, // Preserve completion status
      trainingTime: existingPlan?.trainingTime || (dayType.type === 'training' ? '18:30' : undefined),
      meals: existingPlan?.meals || [],
      originalMacros: existingPlan?.originalMacros || (currentMacros ? {
        kcal: currentMacros.kcal,
        protein: currentMacros.protein,
        carbs: currentMacros.carbs,
        fat: currentMacros.fat
      } : undefined),
      history: existingPlan ? [
        ...(existingPlan.history || []),
        {
          type: existingPlan.type,
          timestamp: new Date().toISOString(),
          completed: existingPlan.completed,
          trainingTime: existingPlan.trainingTime,
          originalMacros: existingPlan.originalMacros
        }
      ] : []
    }
    
    // Remove existing plan for this date and add new one
    const updatedPlannedDays = plannedDays.filter(day => day.date !== dateStr)
    updatedPlannedDays.push(newPlan)
    
    setPlannedDays(updatedPlannedDays)
    setShowDayTypeModal(false)
    setShowEditModal(false)
    setSelectedDay(null)
  }

  const editTodayDayType = () => {
    setSelectedDay(currentDay)
    setShowDayTypeModal(true)
  }

  const getTodayHistory = () => {
    if (!todayPlan) return []
    return todayPlan.history || []
  }

  const openEditMacros = () => {
    if (userMacros) {
      setEditingMacros({ ...userMacros })
      setShowEditMacrosModal(true)
      setShowSettingsModal(false)
    }
  }

  const saveEditedMacros = () => {
    if (editingMacros) {
      setUserMacros(editingMacros)
      setShowEditMacrosModal(false)
      setEditingMacros(null)
      
      // Note: Only affects incomplete current days and future days
      // Completed days keep their original macros forever and are never updated
    }
  }

  const cancelEditMacros = () => {
    setShowEditMacrosModal(false)
    setEditingMacros(null)
  }

  const getDayPlan = (dayIndex: number) => {
    const date = new Date()
    date.setDate(date.getDate() - currentDay + dayIndex)
    const dateStr = date.toISOString().split('T')[0]
    return plannedDays.find(day => day.date === dateStr)
  }

  const markTodayCompleted = () => {
    if (!todayPlan) return
    
    const updatedPlannedDays = plannedDays.map(day => 
      day.date === todayDateStr 
        ? { 
            ...day, 
            completed: true,
            // Save original macros when completing for the first time
            originalMacros: day.originalMacros || (userMacros?.[day.type] ? {
              kcal: userMacros[day.type].kcal,
              protein: userMacros[day.type].protein,
              carbs: userMacros[day.type].carbs,
              fat: userMacros[day.type].fat
            } : undefined)
          }
        : day
    )
    
    setPlannedDays(updatedPlannedDays)
  }

  // HoldToComplete Component
  const HoldToComplete = () => {
    const [holdProgress, setHoldProgress] = useState(0)
    const [isHolding, setIsHolding] = useState(false)
    const holdDuration = 2000 // 2 seconds
    
    // Use useCallback to prevent state updates during render
    const handleCompletion = useCallback(() => {
      if (!todayPlan) return
      
      if (todayPlan.completed) {
        // Unlock completed day
        const updatedPlannedDays = plannedDays.map(day => 
          day.date === todayDateStr 
            ? { ...day, completed: false }
            : day
        )
        setPlannedDays(updatedPlannedDays)
      } else {
        // Complete current day
        markTodayCompleted()
      }
    }, [todayPlan, plannedDays, todayDateStr, setPlannedDays, markTodayCompleted])
    
    useEffect(() => {
      let interval: number
      
      if (isHolding && todayPlan) {
        interval = setInterval(() => {
          setHoldProgress(prev => {
            const newProgress = prev + (100 / (holdDuration / 50))
            if (newProgress >= 100) {
              // Schedule completion for next tick to avoid setState during render
              setTimeout(() => {
                handleCompletion()
              }, 0)
              setIsHolding(false)
              return 0
            }
            return newProgress
          })
        }, 50)
      } else {
        setHoldProgress(0)
      }
      
      return () => clearInterval(interval)
    }, [isHolding, todayPlan?.completed, handleCompletion])

    const handleStart = () => {
      if (!todayPlan) return
      setIsHolding(true)
    }

    const handleEnd = () => {
      setIsHolding(false)
      setHoldProgress(0)
    }

    if (!todayPlan) return null

    // Get colors based on day type
    const getButtonColors = () => {
      if (todayPlan.completed) {
        // Completed state - red for unlock
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-500/40',
          hover: 'hover:bg-red-500/30',
          progressColor: 'text-red-500',
          progressBg: 'text-red-500/20',
          iconColor: 'text-red-400',
          textColor: 'text-red-400'
        }
      } else {
        // Active state based on day type
        switch (todayPlan.type) {
          case 'training':
            return {
              bg: isHolding ? 'bg-green-500/30' : 'bg-dark-tertiary',
              border: isHolding ? 'border-green-500/50' : 'border-dark-quaternary/30',
              hover: 'hover:bg-green-500/20',
              progressColor: 'text-green-500',
              progressBg: 'text-green-500/20',
              iconColor: isHolding ? 'text-green-400' : 'text-dark-gray-primary',
              textColor: isHolding ? 'text-green-400' : 'text-dark-gray-primary'
            }
          case 'rest':
            return {
              bg: isHolding ? 'bg-blue-500/30' : 'bg-dark-tertiary',
              border: isHolding ? 'border-blue-500/50' : 'border-dark-quaternary/30',
              hover: 'hover:bg-blue-500/20',
              progressColor: 'text-blue-500',
              progressBg: 'text-blue-500/20',
              iconColor: isHolding ? 'text-blue-400' : 'text-dark-gray-primary',
              textColor: isHolding ? 'text-blue-400' : 'text-dark-gray-primary'
            }
          case 'fasting':
            return {
              bg: isHolding ? 'bg-red-500/30' : 'bg-dark-tertiary',
              border: isHolding ? 'border-red-500/50' : 'border-dark-quaternary/30',
              hover: 'hover:bg-red-500/20',
              progressColor: 'text-red-500',
              progressBg: 'text-red-500/20',
              iconColor: isHolding ? 'text-red-400' : 'text-dark-gray-primary',
              textColor: isHolding ? 'text-red-400' : 'text-dark-gray-primary'
            }
          default:
            return {
              bg: 'bg-dark-tertiary',
              border: 'border-dark-quaternary/30',
              hover: 'hover:bg-dark-tertiary/80',
              progressColor: 'text-green-500',
              progressBg: 'text-dark-gray-quaternary/20',
              iconColor: 'text-dark-gray-primary',
              textColor: 'text-dark-gray-primary'
            }
        }
      }
    }

    const colors = getButtonColors()

    return (
      <div className="w-full">
        <motion.button
          onMouseDown={handleStart}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchEnd={handleEnd}
          className={`relative w-full h-16 rounded-xl flex items-center justify-center transition-all duration-200 ${colors.bg} border ${colors.border} ${colors.hover} ${
            isHolding ? 'scale-95' : ''
          }`}
          whileHover={{ scale: 1.02 }}
          style={{ userSelect: 'none' }}
        >
          {/* Progress Ring - Always show */}
          <div className="absolute inset-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={colors.progressBg}
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className={colors.progressColor}
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - holdProgress / 100)}`}
                style={{
                  transition: 'stroke-dashoffset 0.1s ease-out'
                }}
              />
            </svg>
          </div>
          
          {/* Content */}
          <div className="flex items-center gap-3 z-10">
            <CheckCircle className={`w-6 h-6 ${colors.iconColor}`} />
            <span className={`font-medium ${colors.textColor}`}>
              {todayPlan.completed 
                ? isHolding 
                  ? 'Entsperren...' 
                  : 'Halten zum Entsperren'
                : isHolding 
                  ? 'Halten...' 
                  : 'Halten zum Abschließen'
              }
            </span>
          </div>
        </motion.button>
      </div>
    )
  }

  // History Calendar Component
  const HistoryModal = () => {
    const [currentWeekOffset, setCurrentWeekOffset] = useState(0)
    const [viewingHistoryDay, setViewingHistoryDay] = useState<PlannedDay | null>(null)
    
    // Calculate week dates
    const getWeekDates = (weekOffset: number) => {
      const now = new Date()
      const monday = new Date(now)
      monday.setDate(now.getDate() - now.getDay() + 1 - (weekOffset * 7))
      
      const weekDates = []
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday)
        date.setDate(monday.getDate() + i)
        weekDates.push(date)
      }
      return weekDates
    }

    const currentWeekDates = getWeekDates(currentWeekOffset)
    const isCurrentWeek = currentWeekOffset === 0

    const getMonthYear = (dates: Date[]) => {
      const firstDate = dates[0]
      const lastDate = dates[6]
      if (firstDate.getMonth() === lastDate.getMonth()) {
        return firstDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
      } else {
        return `${firstDate.toLocaleDateString('de-DE', { month: 'short' })} - ${lastDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`
      }
    }

    const getDayStatus = (date: Date) => {
      const dateStr = date.toISOString().split('T')[0]
      return plannedDays.find(day => day.date === dateStr)
    }

    const getDayTypeInfo = (type: string) => {
      return dayTypes.find(dt => dt.type === type)
    }

    const getDayColors = (dayStatus: PlannedDay | undefined, isToday: boolean, date: Date) => {
      if (isToday) {
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-apple'
      }
      
      if (dayStatus?.completed) {
        switch (dayStatus.type) {
          case 'training':
            return 'bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30 cursor-pointer'
          case 'rest':
            return 'bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 cursor-pointer'
          case 'fasting':
            return 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 cursor-pointer'
          default:
            return 'bg-dark-tertiary/30 text-dark-gray-quaternary'
        }
      }
      
      if (dayStatus && !dayStatus.completed) {
        // Started but not completed - show in yellow
        return 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 cursor-pointer'
      }
      
      // No plan or past day without plan
      const isPastDay = date < new Date(new Date().setHours(0,0,0,0))
      return isPastDay 
        ? 'bg-dark-tertiary/30 text-dark-gray-quaternary'
        : 'bg-dark-tertiary/50 text-dark-gray-tertiary hover:bg-dark-tertiary'
    }

    const viewDayDetails = (dayStatus: PlannedDay) => {
      setViewingHistoryDay(dayStatus)
    }

    if (viewingHistoryDay) {
      const dayMacros = getMacrosForPlannedDay(viewingHistoryDay)
      const dayTypeInfo = dayTypes.find(dt => dt.type === viewingHistoryDay.type)
      
      return (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setViewingHistoryDay(null)}
        >
          <motion.div
            className="bg-dark-secondary rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {new Date(viewingHistoryDay.date).toLocaleDateString('de-DE', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </h3>
                <p className="text-dark-gray-tertiary">
                  {dayTypeInfo?.label} • {viewingHistoryDay.completed ? 'Abgeschlossen' : 'Unvollständig'}
                </p>
              </div>
              <motion.button
                onClick={() => setViewingHistoryDay(null)}
                className="w-8 h-8 rounded-lg bg-dark-tertiary flex items-center justify-center"
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-4 h-4 text-dark-gray-primary" />
              </motion.button>
            </div>

            {/* Mini Dashboard */}
            <div className="space-y-4">
              {/* Day Type Display */}
              <div className={`card ${dayTypeInfo?.bgColor} border ${dayTypeInfo?.borderColor}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br ${dayTypeInfo?.color}`}>
                    <div className="text-white font-bold text-xl">
                      {viewingHistoryDay.type === 'training' ? 'T' : 
                       viewingHistoryDay.type === 'rest' ? 'R' : 
                       'F'}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{dayTypeInfo?.label}</h3>
                    <p className="text-dark-gray-tertiary">{dayTypeInfo?.description}</p>
                  </div>
                </div>
              </div>

              {/* Calories */}
              {dayMacros && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">{dayMacros.kcal}</div>
                  <div className="text-lg font-medium text-gray-400 mb-4">Kalorien</div>
                  
                  {/* Macros */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                      <div className="text-xl font-bold text-red-400">{dayMacros.protein}g</div>
                      <div className="text-xs text-dark-gray-tertiary">Protein</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                      <div className="text-xl font-bold text-yellow-400">{dayMacros.carbs}g</div>
                      <div className="text-xs text-dark-gray-tertiary">Carbs</div>
                    </div>
                    <div className="text-center p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                      <div className="text-xl font-bold text-blue-400">{dayMacros.fat}g</div>
                      <div className="text-xs text-dark-gray-tertiary">Fett</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status */}
              <div className={`p-3 rounded-xl text-center ${
                viewingHistoryDay.completed 
                  ? 'bg-green-500/10 border border-green-500/20'
                  : 'bg-yellow-500/10 border border-yellow-500/20'
              }`}>
                <p className={`text-sm font-medium ${
                  viewingHistoryDay.completed ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {viewingHistoryDay.completed ? '✓ Tag erfolgreich abgeschlossen' : '○ Tag wurde gestartet aber nicht abgeschlossen'}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )
    }

    return (
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowHistory(false)}
      >
        <motion.div
          className="bg-dark-secondary rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white">Verlauf</h3>
              <p className="text-dark-gray-tertiary">{getMonthYear(currentWeekDates)}</p>
            </div>
            <motion.button
              onClick={() => setShowHistory(false)}
              className="w-8 h-8 rounded-lg bg-dark-tertiary flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <X className="w-4 h-4 text-dark-gray-primary" />
            </motion.button>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-6">
            <motion.button
              onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
              className="px-4 py-2 rounded-lg bg-dark-tertiary text-dark-gray-primary text-sm font-medium"
              whileTap={{ scale: 0.95 }}
            >
              ← Vorherige
            </motion.button>
            
            <span className="text-sm text-dark-gray-tertiary">
              {currentWeekOffset === 0 ? 'Diese Woche' : `Vor ${currentWeekOffset} Woche${currentWeekOffset > 1 ? 'n' : ''}`}
            </span>
            
            <motion.button
              onClick={() => setCurrentWeekOffset(Math.max(0, currentWeekOffset - 1))}
              disabled={currentWeekOffset === 0}
              className="px-4 py-2 rounded-lg bg-dark-tertiary text-dark-gray-primary text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              whileTap={{ scale: currentWeekOffset === 0 ? 1 : 0.95 }}
            >
              Nächste →
            </motion.button>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-3">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map((day) => (
                <div key={day.short} className="text-center text-xs font-medium text-dark-gray-tertiary py-2">
                  {day.short}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {currentWeekDates.map((date, index) => {
                const dayStatus = getDayStatus(date)
                const dayTypeInfo = dayStatus ? getDayTypeInfo(dayStatus.type) : null
                const isToday = isCurrentWeek && index === currentDay
                const dayColors = getDayColors(dayStatus, isToday, date)

                return (
                  <motion.button
                    key={date.toISOString()}
                    onClick={() => {
                      if (dayStatus) {
                        viewDayDetails(dayStatus)
                      }
                    }}
                    className={`
                      relative aspect-square rounded-xl p-2 text-sm font-medium transition-all duration-200
                      ${dayColors}
                    `}
                    whileTap={{ scale: dayStatus ? 0.95 : 1 }}
                    disabled={!dayStatus}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <span className="text-xs">{date.getDate()}</span>
                      {dayStatus && (
                        <div className={`text-xs mt-1 px-1 py-0.5 rounded font-medium ${
                          dayStatus.type === 'training' ? 'bg-green-500/30 text-green-400' :
                          dayStatus.type === 'rest' ? 'bg-blue-500/30 text-blue-400' :
                          'bg-gray-500/30 text-gray-400'
                        }`}>
                          {dayStatus.type === 'training' ? 'T' : dayStatus.type === 'rest' ? 'R' : 'F'}
                        </div>
                      )}
                    </div>

                    {/* Current day indicator */}
                    {isToday && (
                      <div className="absolute -bottom-1 left-1/2 w-1.5 h-1.5 bg-white rounded-full" style={{ transform: 'translateX(-50%)' }} />
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-dark-quaternary/30">
            <h4 className="text-sm font-medium text-white mb-3">Legende</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full" />
                <span className="text-dark-gray-tertiary">Trainingstag abgeschlossen</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full" />
                <span className="text-dark-gray-tertiary">Ruhetag abgeschlossen</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full" />
                <span className="text-dark-gray-tertiary">Fastentag abgeschlossen</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                <span className="text-dark-gray-tertiary">Tag gestartet</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-dark-tertiary rounded-full" />
                <span className="text-dark-gray-tertiary">Kein Plan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                <span className="text-dark-gray-tertiary">Heutiger Tag</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  // Modern Clock-like TimePicker Component
  const TimePicker = ({ value, onChange, disabled = false }: { 
    value: string
    onChange: (time: string) => void
    disabled?: boolean 
  }) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const [selectedHours, setSelectedHours] = useState(value.split(':')[0] || '18')
    const [selectedMinutes, setSelectedMinutes] = useState(value.split(':')[1] || '30')
    const [hasChangedHours, setHasChangedHours] = useState(false)
    const [hasChangedMinutes, setHasChangedMinutes] = useState(false)

    // Update when value changes externally
    useEffect(() => {
      if (value) {
        setSelectedHours(value.split(':')[0] || '18')
        setSelectedMinutes(value.split(':')[1] || '30')
        setHasChangedHours(false)
        setHasChangedMinutes(false)
      }
    }, [value])

    // Auto-close when both have been changed
    useEffect(() => {
      if (hasChangedHours && hasChangedMinutes) {
        setTimeout(() => {
          const newTime = `${selectedHours}:${selectedMinutes}`
          onChange(newTime)
          setIsExpanded(false)
          setHasChangedHours(false)
          setHasChangedMinutes(false)
        }, 500)
      }
    }, [hasChangedHours, hasChangedMinutes, selectedHours, selectedMinutes, onChange])

    const handleHourSelect = (hour: string) => {
      setSelectedHours(hour)
      setHasChangedHours(true)
    }

    const handleMinuteSelect = (minute: string) => {
      setSelectedMinutes(minute)
      setHasChangedMinutes(true)
    }

    const handleManualClose = () => {
      const newTime = `${selectedHours}:${selectedMinutes}`
      onChange(newTime)
      setIsExpanded(false)
      setHasChangedHours(false)
      setHasChangedMinutes(false)
    }

    return (
      <div className="space-y-3">
        <motion.button
          onClick={() => !disabled && setIsExpanded(!isExpanded)}
          disabled={disabled}
          className={`w-full p-4 rounded-xl border transition-all duration-200 ${
            disabled 
              ? 'bg-dark-tertiary/30 border-dark-quaternary/30 cursor-not-allowed opacity-50'
              : isExpanded
                ? 'bg-blue-500/20 border-blue-500/40'
                : 'bg-dark-tertiary/50 border-dark-quaternary/40 hover:bg-dark-tertiary'
          }`}
          whileHover={{ scale: disabled ? 1 : 1.02 }}
          whileTap={{ scale: disabled ? 1 : 0.98 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-white">Trainingszeit</h4>
                <p className="text-sm text-dark-gray-tertiary">Wann trainierst du?</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-400">{selectedHours}:{selectedMinutes}</div>
              <div className="text-xs text-dark-gray-tertiary">Uhr</div>
            </div>
          </div>
        </motion.button>

        <AnimatePresence>
          {isExpanded && !disabled && (
            <motion.div
              className="overflow-hidden bg-dark-tertiary/30 rounded-xl p-6 border border-dark-quaternary/30"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Clock Display */}
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-white mb-2">
                  {selectedHours}:{selectedMinutes}
                </div>
                <div className="text-sm text-blue-400">
                  {hasChangedHours && hasChangedMinutes ? '⏱️ Zeit wird gespeichert...' : 'Trainingszeit'}
                </div>
              </div>

              {/* Modern Time Selection */}
              <div className="space-y-8">
                {/* Hours Slider */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-white text-center">
                    Stunden {hasChangedHours && '✓'}
                  </label>
                  
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="23"
                      value={parseInt(selectedHours)}
                      onChange={(e) => handleHourSelect(e.target.value.padStart(2, '0'))}
                      className="w-full h-3 bg-dark-secondary rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(parseInt(selectedHours) / 23) * 100}%, #374151 ${(parseInt(selectedHours) / 23) * 100}%, #374151 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-dark-gray-tertiary mt-2">
                      <span>00</span>
                      <span className={`font-medium ${hasChangedHours ? 'text-green-400' : 'text-blue-400'}`}>
                        {selectedHours}:00
                      </span>
                      <span>23</span>
                    </div>
                  </div>
                </div>

                {/* Minutes Buttons */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-white text-center">
                    Minuten {hasChangedMinutes && '✓'}
                  </label>
                  
                  <div className="grid grid-cols-4 gap-3">
                    {['00', '15', '30', '45'].map(minute => (
                      <motion.button
                        key={minute}
                        onClick={() => handleMinuteSelect(minute)}
                        className={`p-4 rounded-xl font-medium transition-all duration-200 ${
                          selectedMinutes === minute
                            ? hasChangedMinutes 
                              ? 'bg-green-500 text-white shadow-lg scale-105'
                              : 'bg-blue-500 text-white shadow-lg scale-105'
                            : 'bg-dark-secondary hover:bg-dark-secondary/80 text-dark-gray-primary border border-dark-quaternary/30 hover:border-blue-500/30'
                        }`}
                        whileHover={{ scale: selectedMinutes === minute ? 1.05 : 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        :{minute}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="mt-6 flex justify-center gap-2">
                <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  hasChangedHours ? 'bg-green-500' : 'bg-dark-quaternary'
                }`} />
                <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  hasChangedMinutes ? 'bg-green-500' : 'bg-dark-quaternary'
                }`} />
              </div>

              {/* Manual Close Button */}
              {(!hasChangedHours || !hasChangedMinutes) && (
                <div className="mt-6 flex justify-end">
                  <motion.button
                    onClick={handleManualClose}
                    className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium transition-all duration-200 hover:bg-blue-600 shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Zeit bestätigen
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  const updateTrainingTime = (dayIndex: number, time: string) => {
    const date = new Date()
    date.setDate(date.getDate() - currentDay + dayIndex)
    const dateStr = date.toISOString().split('T')[0]
    
    const updatedPlannedDays = plannedDays.map(day => 
      day.date === dateStr 
        ? { ...day, trainingTime: time }
        : day
    )
    
    setPlannedDays(updatedPlannedDays)
  }

  return (
    <div className="min-h-screen bg-dark-primary safe-area">
      {/* Header */}
      <header className="px-6 py-4 bg-dark-primary/95 backdrop-blur-apple border-b border-dark-quaternary/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">CoachAI</h1>
            <p className="text-sm text-dark-gray-tertiary">Dein Fitness Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => setShowHistory(true)}
              className="w-10 h-10 rounded-xl bg-dark-tertiary flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <History className="w-5 h-5 text-dark-gray-primary" strokeWidth={1.5} />
            </motion.button>
            <motion.button
              onClick={() => setShowSettingsModal(true)}
              className="w-10 h-10 rounded-xl bg-dark-tertiary flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="w-5 h-5 text-dark-gray-primary" strokeWidth={1.5} />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Weekly Navigation */}
      <div className="px-6 py-4 bg-dark-secondary/50 border-b border-dark-quaternary/20">
        <div className="flex justify-between gap-2">
          {weekDays.map((day, index) => {
            const dayPlan = getDayPlan(index)
            const dayTypeInfo = dayPlan ? dayTypes.find(dt => dt.type === dayPlan.type) : null
            const isToday = index === currentDay
            const isSelected = index === viewingDay
            const isFuture = index > currentDay
            
            return (
              <motion.button
                key={index}
                onClick={() => {
                  if (!isFuture) {
                    handleDaySelect(index)
                  }
                }}
                disabled={isFuture}
                className={`flex-1 relative py-3 px-2 rounded-xl transition-all duration-300 ${
                  isFuture
                    ? 'bg-dark-tertiary/20 opacity-40 cursor-not-allowed'
                    : isSelected
                      ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-apple' 
                      : dayPlan
                        ? `${dayTypeInfo?.bgColor} ${dayTypeInfo?.borderColor} border`
                        : 'bg-dark-tertiary/50 hover:bg-dark-tertiary'
                }`}
                whileTap={{ scale: isFuture ? 1 : 0.95 }}
                whileHover={{ scale: isFuture ? 1 : 1.02 }}
              >
                <div className="text-center">
                  <div className={`text-xs font-medium ${
                    isFuture
                      ? 'text-dark-gray-quaternary'
                      : isSelected 
                        ? 'text-white' 
                        : 'text-dark-gray-tertiary'
                  }`}>
                    {day.short}
                  </div>
                  <div className={`text-lg font-bold ${
                    isFuture
                      ? 'text-dark-gray-quaternary'
                      : isSelected 
                        ? 'text-white' 
                        : 'text-dark-gray-primary'
                  }`}>
                    {today.getDate() - currentDay + index}
                  </div>
                </div>
                
                {/* Today indicator (white dot) */}
                {isToday && (
                  <motion.div
                    className="absolute -bottom-1 left-1/2 w-2 h-2 bg-white rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{ x: '-50%' }}
                  />
                )}
                
                {/* Day type indicator */}
                {dayPlan && !isFuture && (
                  <div className="absolute top-1 right-1 text-xs">
                    <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      dayPlan.type === 'training' ? 'bg-green-500/30 text-green-400' :
                      dayPlan.type === 'rest' ? 'bg-blue-500/30 text-blue-400' :
                      'bg-gray-500/30 text-gray-400'
                    }`}>
                      {dayPlan.type === 'training' ? 'T' : dayPlan.type === 'rest' ? 'R' : 'F'}
                    </div>
                  </div>
                )}

                {/* Add button only for today if no plan exists */}
                {isToday && !dayPlan && (
                  <motion.div
                    className="absolute top-1 left-1 w-3 h-3 bg-green-500/30 rounded-full flex items-center justify-center"
                    whileHover={{ scale: 1.2 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDayClick(index)
                    }}
                  >
                    <Plus className="w-2 h-2 text-green-500" />
                  </motion.div>
                )}

                {/* Edit button for existing plans (only today or incomplete past days) */}
                {dayPlan && (isToday || (index < currentDay && !dayPlan.completed)) && (
                  <motion.div
                    className="absolute top-1 left-1 w-3 h-3 bg-gray-500/30 rounded-full flex items-center justify-center"
                    whileHover={{ scale: 1.2 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDayClick(index)
                    }}
                  >
                    <div className="w-1 h-1 bg-gray-400 rounded-full" />
                  </motion.div>
                )}

                {/* Future day indicator */}
                {isFuture && (
                  <div className="absolute bottom-1 right-1 text-xs text-dark-gray-quaternary">
                    🔒
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="px-6 py-6 space-y-6">
        {/* Selected Day's Plan */}
        {viewingDayPlan && viewingDayMacros ? (
          <motion.div {...fadeInUp} className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" strokeWidth={1.5} />
              <h2 className="text-lg font-semibold text-white">
                {weekDays[viewingDay].full}
                {viewingDay < currentDay && ' (Vergangen)'}
              </h2>
            </div>

            {/* Selected Day's Macro Card - Large and Prominent */}
            <div className={`card ${
              viewingDay === currentDay 
                ? viewingDayPlan.type === 'training'
                  ? 'bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20'
                  : viewingDayPlan.type === 'rest'
                    ? 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20'
                    : 'bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20'
                : viewingDayPlan.type === 'training'
                  ? 'bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20'
                  : viewingDayPlan.type === 'rest'
                    ? 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20'
                    : 'bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20'
            }`}>
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  viewingDay === currentDay 
                    ? viewingDayPlan.type === 'training'
                      ? 'bg-gradient-to-br from-green-500 to-green-600'
                      : viewingDayPlan.type === 'rest'
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                        : 'bg-gradient-to-br from-red-500 to-red-600'
                    : viewingDayPlan.type === 'training'
                      ? 'bg-gradient-to-br from-green-500 to-green-600'
                      : viewingDayPlan.type === 'rest'
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                        : 'bg-gradient-to-br from-red-500 to-red-600'
                }`}>
                  <div className="text-white font-bold text-xl">
                    {viewingDayPlan.type === 'training' ? 'T' : 
                     viewingDayPlan.type === 'rest' ? 'R' : 
                     'F'}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {weekDays[viewingDay].full}
                    {viewingDay < currentDay && ' (Vergangen)'}
                  </h3>
                  <p className={`font-medium ${
                    viewingDay === currentDay 
                      ? viewingDayPlan.type === 'training'
                        ? 'text-green-400'
                        : viewingDayPlan.type === 'rest'
                          ? 'text-blue-400'
                          : 'text-red-400'
                      : viewingDayPlan.type === 'training'
                        ? 'text-green-400'
                        : viewingDayPlan.type === 'rest'
                          ? 'text-blue-400'
                          : 'text-red-400'
                  }`}>
                    {dayTypes.find(dt => dt.type === viewingDayPlan.type)?.description}
                  </p>
                </div>
              </div>

              {/* Large Calorie Display */}
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-white mb-2">{viewingDayMacros?.kcal}</div>
                <div className={`text-lg font-medium ${
                  viewingDay === currentDay 
                    ? viewingDayPlan.type === 'training'
                      ? 'text-green-400'
                      : viewingDayPlan.type === 'rest'
                        ? 'text-blue-400'
                        : 'text-red-400'
                    : viewingDayPlan.type === 'training'
                      ? 'text-green-400'
                      : viewingDayPlan.type === 'rest'
                        ? 'text-blue-400'
                        : 'text-red-400'
                }`}>
                  Kalorien {viewingDay === currentDay ? 'geplant' : 'waren geplant'}
                  {viewingDayPlan?.completed && viewingDayPlan.originalMacros && (
                    <span className="text-sm block mt-1 opacity-75">
                      (Original-Werte zum Zeitpunkt der Planung)
                    </span>
                  )}
                </div>
              </div>

              {/* Macro Breakdown */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  </div>
                  <div className="text-2xl font-bold text-red-400">{viewingDayMacros.protein}g</div>
                  <div className="text-sm text-dark-gray-tertiary">Protein</div>
                </div>
                <div className="text-center p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">{viewingDayMacros.carbs}g</div>
                  <div className="text-sm text-dark-gray-tertiary">Carbs</div>
                </div>
                <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  </div>
                  <div className="text-2xl font-bold text-blue-400">{viewingDayMacros.fat}g</div>
                  <div className="text-sm text-dark-gray-tertiary">Fett</div>
                </div>
              </div>

              {/* Action Buttons - Only for today */}
              {viewingDay === currentDay && todayPlan && (
                <div className="space-y-3 mt-6">
                  {/* Typ ändern Button - now prominent */}
                  <motion.button
                    onClick={editTodayDayType}
                    disabled={todayPlan.completed}
                    className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                      todayPlan.completed 
                        ? 'bg-dark-tertiary/30 text-dark-gray-quaternary cursor-not-allowed opacity-50 border border-dark-quaternary/20'
                        : 'bg-dark-tertiary/50 text-dark-gray-primary hover:bg-dark-tertiary border border-dark-quaternary/30 hover:border-dark-quaternary/50'
                    }`}
                    whileHover={{ scale: todayPlan.completed ? 1 : 1.02 }}
                    whileTap={{ scale: todayPlan.completed ? 1 : 0.98 }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Settings className="w-4 h-4" strokeWidth={1.5} />
                      Tag-Typ ändern
                    </div>
                  </motion.button>

                  {/* Training Time Picker for current day */}
                  {todayPlan.type === 'training' && (
                    <TimePicker
                      value={todayPlan.trainingTime || '18:30'}
                      onChange={(time) => updateTrainingTime(currentDay, time)}
                      disabled={todayPlan.completed}
                    />
                  )}
                </div>
              )}

              {/* Meals Section */}
              {viewingDayPlan && (
                <div className="mt-8 pt-6 border-t border-dark-quaternary/20">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">Mahlzeiten</h4>
                    {viewingDay === currentDay && !todayPlan?.completed && (
                      <motion.button
                        onClick={() => {/* TODO: Add meal modal */}}
                        className="px-3 py-1.5 bg-dark-tertiary/50 rounded-lg text-sm text-dark-gray-primary border border-dark-quaternary/30 hover:bg-dark-tertiary transition-all duration-200"
                        whileTap={{ scale: 0.95 }}
                      >
                        <Plus className="w-4 h-4 inline mr-1" />
                        Hinzufügen
                      </motion.button>
                    )}
                  </div>

                  {(() => {
                    const meals = viewingDay === currentDay && todayPlan 
                      ? initializeMealsForDay(todayPlan)
                      : viewingDayPlan.meals || []
                    
                    if (meals.length === 0) {
                      return (
                        <div className="text-center py-8 text-dark-gray-tertiary">
                          <div className="text-2xl mb-2">🍽️</div>
                          <p className="text-sm">Noch keine Mahlzeiten geplant</p>
                        </div>
                      )
                    }

                    // Create timeline for display
                    const timeline = createMealTimeline(meals, viewingDayPlan.trainingTime)

                    return (
                      <div className="space-y-3">
                        {timeline.map((item, index) => {
                          if (item.type === 'training') {
                            const trainingData = item.data as { time: string, name: string }
                            return (
                              <motion.div
                                key={`training-${index}`}
                                className="py-3 px-4 rounded-xl border-2 border-dashed border-orange-500/40 bg-orange-500/5"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <div className="flex items-center justify-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                    🏋️
                                  </div>
                                  <div className="text-center">
                                    <h5 className="font-medium text-orange-400">
                                      {trainingData.name}
                                    </h5>
                                    <p className="text-sm text-orange-300">
                                      {trainingData.time} Uhr
                                    </p>
                                  </div>
                                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                    💪
                                  </div>
                                </div>
                              </motion.div>
                            )
                          } else {
                            const meal = item.data as Meal
                            return (
                              <motion.div
                                key={meal.id}
                                className={`p-4 rounded-xl border transition-all duration-200 ${
                                  meal.status === 'locked'
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : meal.status === 'completed'
                                      ? 'bg-blue-500/10 border-blue-500/30'
                                      : 'bg-dark-tertiary/30 border-dark-quaternary/30 hover:bg-dark-tertiary/50'
                                }`}
                                whileHover={{ scale: 1.01 }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                      meal.status === 'locked' 
                                        ? 'bg-green-500/20 text-green-400' 
                                        : meal.status === 'completed'
                                          ? 'bg-blue-500/20 text-blue-400'
                                          : 'bg-dark-secondary text-dark-gray-primary'
                                    }`}>
                                      {meal.status === 'locked' ? '🔒' : 
                                       meal.status === 'completed' ? '✓' : 
                                       meal.mealType === 'pre-long' ? '🥗' :
                                       meal.mealType === 'pre-short' ? '⚡' :
                                       meal.mealType === 'post' ? '💪' :
                                       meal.mealType === 'recovery' ? '🌙' :
                                       meal.mealType === 'break-fast' ? '🍽️' :
                                       timeline.filter(t => t.type === 'meal').findIndex(t => (t.data as Meal).id === meal.id) + 1}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <h5 className={`font-medium ${
                                          meal.status === 'locked' ? 'text-green-400' : 
                                          meal.status === 'completed' ? 'text-blue-400' :
                                          'text-white'
                                        }`}>
                                          {meal.name}
                                        </h5>
                                        {meal.relativeToTraining && (
                                          <span className="text-xs bg-dark-secondary px-2 py-0.5 rounded text-dark-gray-tertiary">
                                            {meal.relativeToTraining}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        {meal.time && (
                                          <p className="text-sm text-dark-gray-tertiary">
                                            {meal.time} Uhr
                                          </p>
                                        )}
                                        {meal.suggestedTime && meal.time !== meal.suggestedTime && (
                                          <p className="text-xs text-yellow-400">
                                            (Vorschlag: {meal.suggestedTime})
                                          </p>
                                        )}
                                      </div>
                                      {meal.warnings && meal.warnings.length > 0 && (
                                        <div className="mt-2">
                                          {meal.warnings.map((warning, idx) => (
                                            <p key={idx} className="text-xs text-orange-400 flex items-center gap-1">
                                              ⚠️ {warning}
                                            </p>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {(meal.calories || 0) > 0 && (
                                      <div className="text-right">
                                        <div className="text-sm font-medium text-white">
                                          {meal.calories} kcal
                                        </div>
                                        <div className="text-xs text-dark-gray-tertiary">
                                          P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
                                        </div>
                                        {meal.mealType === 'pre-short' && meal.fat && meal.fat > 5 && (
                                          <div className="text-xs text-orange-400 mt-1">
                                            ⚠️ Zu viel Fett
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    
                                    {viewingDay === currentDay && !todayPlan?.completed && (
                                      <div className="flex flex-col gap-1">
                                        {meal.status === 'open' && (
                                          <motion.button
                                            onClick={() => {/* TODO: Mark as completed */}}
                                            className="w-8 h-8 rounded-lg bg-green-500/20 hover:bg-green-500/30 flex items-center justify-center transition-colors"
                                            whileTap={{ scale: 0.95 }}
                                            title="Als gegessen markieren"
                                          >
                                            ✓
                                          </motion.button>
                                        )}
                                        {meal.status === 'completed' && (
                                          <motion.button
                                            onClick={() => {/* TODO: Lock meal */}}
                                            className="w-8 h-8 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 flex items-center justify-center transition-colors"
                                            whileTap={{ scale: 0.95 }}
                                            title="Endgültig sperren"
                                          >
                                            🔒
                                          </motion.button>
                                        )}
                                        {meal.status === 'locked' && (
                                          <motion.button
                                            onClick={() => {/* TODO: Unlock meal */}}
                                            className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-colors"
                                            whileTap={{ scale: 0.95 }}
                                            title="Entsperren"
                                          >
                                            🔓
                                          </motion.button>
                                        )}
                                        <motion.button
                                          onClick={() => {/* TODO: Edit meal */}}
                                          className="w-8 h-8 rounded-lg bg-dark-secondary hover:bg-dark-secondary/80 flex items-center justify-center transition-colors"
                                          whileTap={{ scale: 0.95 }}
                                          title="Bearbeiten"
                                        >
                                          <Settings className="w-4 h-4 text-dark-gray-primary" />
                                        </motion.button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )
                          }
                        })}
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Hold to Complete Button - moved to bottom */}
              {viewingDay === currentDay && todayPlan && (
                <div className="mt-8 pt-6 border-t border-dark-quaternary/20">
                  <HoldToComplete />
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          // No plan for selected day
          <motion.div {...fadeInUp} className="space-y-4">
            <h2 className="text-lg font-semibold text-white">
              {weekDays[viewingDay].full}
              {viewingDay < currentDay && ' (Vergangen)'}
            </h2>
            <div className="card text-center">
              <div className="text-4xl mb-3">
                {viewingDay < currentDay ? '📅' : '📅'}
              </div>
              <h3 className="font-semibold text-white mb-2">
                {viewingDay < currentDay
                  ? `Kein Plan für ${weekDays[viewingDay].full}`
                  : 'Noch kein Plan für diesen Tag'
                }
              </h3>
              <p className="text-sm text-dark-gray-tertiary mb-4">
                {viewingDay < currentDay
                  ? 'Dieser Tag ist bereits vergangen.'
                  : 'Wähle einen Tag-Typ um zu starten.'
                }
              </p>
              {viewingDay === currentDay && (
                <motion.button
                  onClick={() => handleDayClick(viewingDay)}
                  className="btn-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Tag starten
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Modals would go here - keeping them simple for now */}
      <AnimatePresence>
        {(showDayTypeModal || showEditModal) && (
          <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <motion.div className="bg-dark-secondary rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold text-white mb-4">Tag-Typ wählen</h3>
              <div className="space-y-3">
                {dayTypes.map((dayType) => (
                  <motion.button
                    key={dayType.type}
                    onClick={() => handleDayTypeSelect(dayType)}
                    className={`w-full p-4 rounded-xl border ${dayType.bgColor} ${dayType.borderColor}`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <h4 className="font-semibold text-white">{dayType.label}</h4>
                  </motion.button>
                ))}
              </div>
              <motion.button
                onClick={() => {
                  setShowDayTypeModal(false)
                  setShowEditModal(false)
                  setSelectedDay(null)
                }}
                className="w-full mt-4 py-2 px-4 bg-dark-tertiary text-white rounded-xl"
              >
                Abbrechen
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {showHistory && <HistoryModal />}

        {showSettingsModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettingsModal(false)}
          >
            <motion.div
              className="bg-dark-secondary rounded-2xl p-6 max-w-md w-full"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Einstellungen</h3>
                <motion.button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-8 h-8 rounded-lg bg-dark-tertiary flex items-center justify-center"
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-4 h-4 text-dark-gray-primary" />
                </motion.button>
              </div>

              <div className="space-y-4">
                <motion.button
                  onClick={openEditMacros}
                  className="w-full p-4 bg-dark-tertiary/50 rounded-xl border border-dark-quaternary/30 hover:bg-dark-tertiary transition-all duration-200"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-white">Makronährstoffe bearbeiten</h4>
                      <p className="text-sm text-dark-gray-tertiary">Ziele für Training, Ruhe und Fasten</p>
                    </div>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showEditMacrosModal && editingMacros && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cancelEditMacros}
          >
            <motion.div
              className="bg-dark-secondary rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Makronährstoffe bearbeiten</h3>
                <motion.button
                  onClick={cancelEditMacros}
                  className="w-8 h-8 rounded-lg bg-dark-tertiary flex items-center justify-center"
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-4 h-4 text-dark-gray-primary" />
                </motion.button>
              </div>

              <div className="space-y-6">
                {/* Training Day Macros */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-white text-lg">Trainingstag</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <NumberInput
                      label="Kalorien"
                      value={editingMacros.training.kcal}
                      onChange={(value) => setEditingMacros({
                        ...editingMacros,
                        training: { ...editingMacros.training, kcal: value }
                      })}
                      unit="kcal"
                    />
                    <NumberInput
                      label="Protein"
                      value={editingMacros.training.protein}
                      onChange={(value) => setEditingMacros({
                        ...editingMacros,
                        training: { ...editingMacros.training, protein: value }
                      })}
                      unit="g"
                    />
                    <NumberInput
                      label="Kohlenhydrate"
                      value={editingMacros.training.carbs}
                      onChange={(value) => setEditingMacros({
                        ...editingMacros,
                        training: { ...editingMacros.training, carbs: value }
                      })}
                      unit="g"
                    />
                    <NumberInput
                      label="Fett"
                      value={editingMacros.training.fat}
                      onChange={(value) => setEditingMacros({
                        ...editingMacros,
                        training: { ...editingMacros.training, fat: value }
                      })}
                      unit="g"
                    />
                  </div>
                </div>

                {/* Rest Day Macros */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-white text-lg">Ruhetag</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <NumberInput
                      label="Kalorien"
                      value={editingMacros.rest.kcal}
                      onChange={(value) => setEditingMacros({
                        ...editingMacros,
                        rest: { ...editingMacros.rest, kcal: value }
                      })}
                      unit="kcal"
                    />
                    <NumberInput
                      label="Protein"
                      value={editingMacros.rest.protein}
                      onChange={(value) => setEditingMacros({
                        ...editingMacros,
                        rest: { ...editingMacros.rest, protein: value }
                      })}
                      unit="g"
                    />
                    <NumberInput
                      label="Kohlenhydrate"
                      value={editingMacros.rest.carbs}
                      onChange={(value) => setEditingMacros({
                        ...editingMacros,
                        rest: { ...editingMacros.rest, carbs: value }
                      })}
                      unit="g"
                    />
                    <NumberInput
                      label="Fett"
                      value={editingMacros.rest.fat}
                      onChange={(value) => setEditingMacros({
                        ...editingMacros,
                        rest: { ...editingMacros.rest, fat: value }
                      })}
                      unit="g"
                    />
                  </div>
                </div>

                {/* Fasting Day Macros */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-white text-lg">Fastentag</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <NumberInput
                      label="Kalorien"
                      value={editingMacros.fasting.kcal}
                      onChange={(value) => setEditingMacros({
                        ...editingMacros,
                        fasting: { ...editingMacros.fasting, kcal: value }
                      })}
                      unit="kcal"
                    />
                    <NumberInput
                      label="Protein"
                      value={editingMacros.fasting.protein}
                      onChange={(value) => setEditingMacros({
                        ...editingMacros,
                        fasting: { ...editingMacros.fasting, protein: value }
                      })}
                      unit="g"
                    />
                    <NumberInput
                      label="Kohlenhydrate"
                      value={editingMacros.fasting.carbs}
                      onChange={(value) => setEditingMacros({
                        ...editingMacros,
                        fasting: { ...editingMacros.fasting, carbs: value }
                      })}
                      unit="g"
                    />
                    <NumberInput
                      label="Fett"
                      value={editingMacros.fasting.fat}
                      onChange={(value) => setEditingMacros({
                        ...editingMacros,
                        fasting: { ...editingMacros.fasting, fat: value }
                      })}
                      unit="g"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8">
                <motion.button
                  onClick={cancelEditMacros}
                  className="flex-1 py-3 px-4 bg-dark-tertiary text-white rounded-xl font-medium"
                  whileTap={{ scale: 0.98 }}
                >
                  Abbrechen
                </motion.button>
                <motion.button
                  onClick={saveEditedMacros}
                  className="flex-1 py-3 px-4 bg-green-500 text-white rounded-xl font-medium"
                  whileTap={{ scale: 0.98 }}
                >
                  Speichern
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 