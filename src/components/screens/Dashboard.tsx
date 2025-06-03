import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Target, Activity, Calendar, Settings, X, History, CheckCircle, Edit3 } from 'lucide-react'
import { useState, useEffect } from 'react'
import React from 'react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { UserMacros } from '../../types'

interface Meal {
  id: string
  name: string
  time?: string // HH:MM format
  suggestedTime?: string // AI suggested time based on training
  mealType: 'pre-long' | 'pre-short' | 'post' | 'recovery' | 'regular' | 'break-fast'
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  completed?: boolean
  locked?: boolean // true if eaten and confirmed
  status: 'open' | 'completed' | 'locked'
  warnings?: string[]
  // Consumed macros (what was actually eaten)
  consumedCalories?: number
  consumedProtein?: number
  consumedCarbs?: number
  consumedFat?: number
  skipped?: boolean
}

interface MealPlan {
  eatingWindow: { start: string, end: string } // HH:MM format
  mealCount: number
  trainingTime?: string
  lastUpdated: string
}

interface PlannedDay {
  date: string // YYYY-MM-DD format
  type: 'training' | 'rest' | 'fasting'
  completed: boolean
  trainingTime?: string // HH:MM format for training days
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
  meals?: Meal[]
  mealPlan?: MealPlan
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
    if (!isNaN(numValue) && localValue.trim() !== '') {
      let clampedValue = numValue
      if (min !== undefined) clampedValue = Math.max(min, clampedValue)
      if (max !== undefined) clampedValue = Math.min(max, clampedValue)
      onChange(clampedValue)
      setLocalValue(clampedValue.toString())
    } else {
      // Reset to current value if invalid or empty
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
          onChange={(e) => {
            const newValue = e.target.value
            // Allow empty string for temporary state, but prevent negative values
            if (newValue === '' || (!isNaN(Number(newValue)) && Number(newValue) >= 0)) {
              setLocalValue(newValue)
            }
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="input text-center text-xl font-semibold"
          min={min}
          max={max}
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
  const [showMealTrackingModal, setShowMealTrackingModal] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [pendingDayTypeChange, setPendingDayTypeChange] = useState<{ dayType: { type: 'training' | 'rest' | 'fasting', label: string }, currentType?: string } | null>(null)

  // Local state for editing macros
  const [editingMacros, setEditingMacros] = useState<UserMacros | null>(null)

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
    // Allow viewing any day (past, current, future)
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
      return userMacros?.[plannedDay.type] || null
    }
    
    // Fallback: if completed but no original macros (shouldn't happen), use current
    return userMacros?.[plannedDay.type] || null
  }

  // Calculate remaining macros (planned minus consumed/tracked)
  const getRemainingMacrosForPlannedDay = (plannedDay: PlannedDay) => {
    const originalMacros = getMacrosForPlannedDay(plannedDay)
    if (!originalMacros) return null
    
    // Calculate total consumed macros from all tracked meals
    const totalConsumed = (plannedDay.meals || []).reduce((acc, meal) => {
      if (meal.consumedCalories !== undefined) {
        acc.kcal += meal.consumedCalories
        acc.protein += meal.consumedProtein || 0
        acc.carbs += meal.consumedCarbs || 0
        acc.fat += meal.consumedFat || 0
      }
      return acc
    }, { kcal: 0, protein: 0, carbs: 0, fat: 0 })
    
    // Calculate remaining macros
    return {
      kcal: Math.max(0, originalMacros.kcal - totalConsumed.kcal),
      protein: Math.max(0, originalMacros.protein - totalConsumed.protein),
      carbs: Math.max(0, originalMacros.carbs - totalConsumed.carbs),
      fat: Math.max(0, originalMacros.fat - totalConsumed.fat)
    }
  }

  const viewingDayPlan = getViewingDayPlan()
  const viewingDayMacros = viewingDayPlan ? getRemainingMacrosForPlannedDay(viewingDayPlan) : null
  const viewingDayOriginalMacros = viewingDayPlan ? getMacrosForPlannedDay(viewingDayPlan) : null
  const viewingDate = getDateForDay(viewingDay)

  // Get today's planned day (for completion functionality)
  const todayPlan = plannedDays.find(day => day.date === todayDateStr)

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
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      data: userMacros?.fasting,
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
    
    // Get current day plan to check if there's already a type set
    const selectedDate = new Date()
    selectedDate.setDate(selectedDate.getDate() - currentDay + selectedDay)
    const dateStr = selectedDate.toISOString().split('T')[0]
    const existingPlan = plannedDays.find(day => day.date === dateStr)
    
    // If there's already a plan with a different type, show confirmation
    if (existingPlan && existingPlan.type !== dayType.type) {
      const currentDayType = dayTypes.find(dt => dt.type === existingPlan.type)
      setPendingDayTypeChange({ 
        dayType, 
        currentType: currentDayType?.label || existingPlan.type 
      })
      setShowConfirmationModal(true)
      setShowDayTypeModal(false)
      return
    }
    
    // If no existing plan or same type, proceed directly
    confirmDayTypeChange(dayType)
  }

  const confirmDayTypeChange = (dayType: { type: 'training' | 'rest' | 'fasting', label: string }) => {
    if (selectedDay === null) return
    
    // Calculate the date for the selected day
    const selectedDate = new Date()
    selectedDate.setDate(selectedDate.getDate() - currentDay + selectedDay)
    const dateStr = selectedDate.toISOString().split('T')[0]
    
    // Find existing plan to preserve history and completion status
    const existingPlan = plannedDays.find(day => day.date === dateStr)
    
    // Get current macro values for this day type
    const currentMacros = userMacros?.[dayType.type]
    
    // Create new plan with history and original macros
    const newPlan: PlannedDay = {
      date: dateStr,
      type: dayType.type,
      completed: existingPlan?.completed || false, // Preserve completion status
      trainingTime: existingPlan?.trainingTime || (dayType.type === 'training' ? '18:30' : undefined),
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
    setShowConfirmationModal(false)
    setPendingDayTypeChange(null)
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
      
      // Reset meals for all incomplete days so they get regenerated with new macros
      const updatedPlannedDays = plannedDays.map(day => {
        if (!day.completed) {
          // Remove meals for incomplete days - they will be regenerated with new macros
          return { ...day, meals: undefined }
        }
        return day
      })
      setPlannedDays(updatedPlannedDays)
      
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
    
    useEffect(() => {
      let interval: number
      
      if (isHolding && todayPlan) {
        interval = setInterval(() => {
          setHoldProgress(prev => {
            const newProgress = prev + (100 / (holdDuration / 50))
            if (newProgress >= 100) {
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
    }, [isHolding, todayPlan?.completed])

    const handleStart = () => {
      if (!todayPlan) return
      setIsHolding(true)
    }

    const handleEnd = () => {
      setIsHolding(false)
      setHoldProgress(0)
    }

    if (!todayPlan) return null

    return (
      <div className="w-full">
        <motion.button
          onMouseDown={handleStart}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchEnd={handleEnd}
          className={`relative w-full h-16 rounded-xl flex items-center justify-center transition-all duration-200 ${
            todayPlan.completed 
              ? 'bg-red-500/20 border border-red-500/40 hover:bg-red-500/30'
              : isHolding
                ? 'bg-green-500/30 border border-green-500/50 scale-95'
                : 'bg-dark-tertiary hover:bg-dark-tertiary/80 border border-dark-quaternary/30'
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
                className={todayPlan.completed ? 'text-red-500/20' : 'text-dark-gray-quaternary/20'}
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
                className={todayPlan.completed ? 'text-red-500' : 'text-green-500'}
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
            <CheckCircle className={`w-6 h-6 ${
              todayPlan.completed 
                ? 'text-red-400' 
                : isHolding 
                  ? 'text-green-400' 
                  : 'text-dark-gray-primary'
            }`} />
            <span className={`font-medium ${
              todayPlan.completed 
                ? 'text-red-400' 
                : isHolding 
                  ? 'text-green-400' 
                  : 'text-dark-gray-primary'
            }`}>
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
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    viewingDayPlan?.type === 'training'
                      ? 'bg-gradient-to-br from-green-500 to-green-600'
                      : viewingDayPlan?.type === 'rest'
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                        : 'bg-gradient-to-br from-red-500 to-red-600'
                  }`}>
                    <div className="text-white font-bold text-xl">
                      {viewingDayPlan?.type === 'training' ? 'T' : 
                       viewingDayPlan?.type === 'rest' ? 'R' : 
                       'F'}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{dayTypes.find(dt => dt.type === viewingDayPlan?.type)?.label}</h3>
                    <p className="text-dark-gray-tertiary">
                      {dayTypes.find(dt => dt.type === viewingDayPlan?.type)?.description}
                      {viewingDay < currentDay && ' (Vergangener Tag)'}
                    </p>
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
                      <div className="text-sm text-dark-gray-tertiary">Fett</div>
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

                    {/* Today indicator (white dot) */}
                    {isToday && (
                      <motion.div
                        className="absolute -bottom-1 left-1/2 w-1.5 h-1.5 bg-white rounded-full" style={{ transform: 'translateX(-50%)' }} />
                    )}

                    {/* Future day indicator */}
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

  // Initialize meals for a day if they don't exist
  const initializeMealsForDay = (dayPlan: PlannedDay) => {
    if (!dayPlan.meals || dayPlan.meals.length === 0) {
      // Use intelligent meal planning for all day types
      if (dayPlan.type === 'training' && dayPlan.trainingTime) {
        return generateIntelligentMealPlan(dayPlan)
      } else if (dayPlan.type === 'rest') {
        return generateRestDayMealPlan(dayPlan)
      } else if (dayPlan.type === 'fasting') {
        return generateFastingDayMealPlan(dayPlan)
      }
      
      // Fallback to normal templates
      const templates = getMealTemplates(dayPlan.type)
      const initialMeals: Meal[] = templates.map(template => ({
        ...template,
        mealType: dayPlan.type === 'fasting' ? 'break-fast' : 'regular',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        completed: false,
        status: 'open',
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
          { id: 'dinner', name: 'Abendbrot', time: '19:30' }
        ]
      case 'fasting':
        return [
          { id: 'break-fast', name: 'Fastenbrechen', time: '16:00' }
        ]
      default:
        return []
    }
  }

  // Create timeline with meals and training
  const createMealTimeline = (meals: Meal[], trainingTime?: string, dayType?: string) => {
    const timeline: Array<{ type: 'meal' | 'training', data: Meal | { time: string, name: string }, sortTime: number }> = []
    
    // Add meals to timeline
    meals.forEach(meal => {
      if (meal.time) {
        const [hours, minutes] = meal.time.split(':').map(Number)
        const sortTime = hours * 60 + minutes
        timeline.push({ type: 'meal', data: meal, sortTime })
      }
    })
    
    // Add training to timeline ONLY if it's a training day and training time exists
    if (trainingTime && dayType === 'training') {
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
    const preShortTime = addMinutesToTime(trainingTime, -60) // 1h vor Training
    const postTime = addMinutesToTime(trainingTime, 30) // 30min nach Training
    const dinnerTime = addMinutesToTime(trainingTime, 120) // 2h nach Training
    
    // 🏋️‍♂️ TRAININGSTAG LOGIK - Fokus: Energie, Muskelerhalt, Performance
    const totalCalories = dayMacros.kcal
    const totalProtein = dayMacros.protein
    const totalCarbs = dayMacros.carbs
    const totalFat = dayMacros.fat
    
    const meals: Meal[] = [
      {
        id: 'breakfast',
        name: 'Frühstück',
        time: '08:00',
        mealType: 'regular',
        calories: Math.round(totalCalories * 0.20),
        protein: Math.max(30, Math.min(35, Math.round(totalProtein * 0.25))),
        carbs: Math.max(45, Math.min(60, Math.round(totalCarbs * 0.25))),
        fat: Math.min(10, Math.round(totalFat * 0.15)),
        status: 'open',
        locked: false,
        completed: false
      },
      {
        id: 'lunch',
        name: 'Mittag',
        time: '12:30',
        mealType: 'pre-long',
        calories: Math.round(totalCalories * 0.30),
        protein: Math.max(35, Math.min(40, Math.round(totalProtein * 0.30))),
        carbs: Math.max(70, Math.min(90, Math.round(totalCarbs * 0.35))),
        fat: Math.min(12, Math.round(totalFat * 0.20)),
        status: 'open',
        locked: false,
        completed: false
      },
      {
        id: 'pre-workout',
        name: 'Pre Workout',
        time: preShortTime,
        suggestedTime: preShortTime,
        mealType: 'pre-short',
        calories: Math.round(totalCalories * 0.15),
        protein: Math.max(20, Math.min(25, Math.round(totalProtein * 0.20))),
        carbs: Math.max(25, Math.min(35, Math.round(totalCarbs * 0.20))),
        fat: Math.min(5, Math.round(totalFat * 0.05)),
        status: 'open',
        locked: false,
        completed: false
      },
      {
        id: 'post-workout',
        name: 'Post Workout',
        time: postTime,
        suggestedTime: postTime,
        mealType: 'post',
        calories: Math.round(totalCalories * 0.15),
        protein: Math.max(20, Math.min(30, Math.round(totalProtein * 0.20))),
        carbs: Math.max(25, Math.min(35, Math.round(totalCarbs * 0.20))),
        fat: Math.min(5, Math.round(totalFat * 0.05)),
        status: 'open',
        locked: false,
        completed: false
      },
      {
        id: 'dinner',
        name: 'Abendessen',
        time: dinnerTime,
        suggestedTime: dinnerTime,
        mealType: 'recovery',
        calories: Math.round(totalCalories * 0.20),
        protein: Math.max(40, Math.round(totalProtein * 0.05)),
        carbs: 0, // Rest-Carbs - wird durch verbleibende Carbs gefüllt
        fat: Math.max(10, Math.round(totalFat * 0.60)),
        status: 'open',
        locked: false,
        completed: false
      }
    ]
    
    // Berechne verbleibende Carbs für Abendessen
    const usedCarbs = meals.slice(0, 4).reduce((sum, meal) => sum + (meal.carbs || 0), 0)
    const remainingCarbs = Math.max(0, totalCarbs - usedCarbs)
    meals[4].carbs = remainingCarbs
    
    // Update the day with intelligent meals
    const updatedPlannedDays = plannedDays.map(day => 
      day.date === dayPlan.date 
        ? { 
            ...day, 
            meals: meals,
            mealPlan: {
              eatingWindow: { start: '08:00', end: dinnerTime },
              mealCount: 5,
              trainingTime: trainingTime,
              lastUpdated: new Date().toISOString()
            }
          }
        : day
    )
    setPlannedDays(updatedPlannedDays)
    
    return meals
  }

  // Generate intelligent meal plan for rest days
  const generateRestDayMealPlan = (dayPlan: PlannedDay): Meal[] => {
    const dayMacros = getMacrosForPlannedDay(dayPlan)
    if (!dayMacros) return []
    
    const totalCalories = dayMacros.kcal
    const totalProtein = dayMacros.protein
    const totalCarbs = dayMacros.carbs
    const totalFat = dayMacros.fat
    
    const meals: Meal[] = [
      {
        id: 'breakfast',
        name: 'Frühstück',
        time: '09:00',
        mealType: 'regular',
        calories: Math.round(totalCalories * 0.25),
        protein: Math.max(30, Math.round(totalProtein * 0.30)),
        carbs: Math.max(5, Math.min(10, Math.round(totalCarbs * 0.20))),
        fat: Math.max(10, Math.min(15, Math.round(totalFat * 0.25))),
        status: 'open',
        locked: false,
        completed: false
      },
      {
        id: 'lunch',
        name: 'Mittag',
        time: '13:00',
        mealType: 'regular',
        calories: Math.round(totalCalories * 0.35),
        protein: Math.round(totalProtein * 0.35),
        carbs: Math.max(10, Math.min(20, Math.round(totalCarbs * 0.40))),
        fat: Math.round(totalFat * 0.35),
        status: 'open',
        locked: false,
        completed: false
      },
      {
        id: 'afternoon',
        name: 'Nachmittag',
        time: '16:30',
        mealType: 'regular',
        calories: Math.round(totalCalories * 0.15),
        protein: Math.round(totalProtein * 0.20),
        carbs: Math.max(5, Math.round(totalCarbs * 0.20)),
        fat: Math.round(totalFat * 0.20),
        status: 'open',
        locked: false,
        completed: false
      },
      {
        id: 'dinner',
        name: 'Abendbrot',
        time: '19:30',
        mealType: 'regular',
        calories: Math.round(totalCalories * 0.25),
        protein: Math.round(totalProtein * 0.15),
        carbs: Math.max(10, Math.min(15, Math.round(totalCarbs * 0.20))),
        fat: Math.round(totalFat * 0.20),
        status: 'open',
        locked: false,
        completed: false
      }
    ]
    
    // Verteile verbleibendes Protein und Fett
    const usedProtein = meals.reduce((sum, meal) => sum + (meal.protein || 0), 0)
    const usedFat = meals.reduce((sum, meal) => sum + (meal.fat || 0), 0)
    const remainingProtein = Math.max(0, totalProtein - usedProtein)
    const remainingFat = Math.max(0, totalFat - usedFat)
    
    // Verteile Rest auf Abendessen
    meals[3].protein = (meals[3].protein || 0) + remainingProtein
    meals[3].fat = (meals[3].fat || 0) + remainingFat
    
    // Update the day with rest day meals
    const updatedPlannedDays = plannedDays.map(day => 
      day.date === dayPlan.date 
        ? { 
            ...day, 
            meals: meals,
            mealPlan: {
              eatingWindow: { start: '09:00', end: '19:30' },
              mealCount: 4,
              lastUpdated: new Date().toISOString()
            }
          }
        : day
    )
    setPlannedDays(updatedPlannedDays)
    
    return meals
  }

  // Generate intelligent meal plan for fasting days
  const generateFastingDayMealPlan = (dayPlan: PlannedDay): Meal[] => {
    const dayMacros = getMacrosForPlannedDay(dayPlan)
    if (!dayMacros) return []
    
    const totalProtein = dayMacros.protein
    const totalCarbs = dayMacros.carbs
    const totalFat = dayMacros.fat
    const totalCalories = dayMacros.kcal
    
    const meals: Meal[] = [
      {
        id: 'break-fast',
        name: 'Fastenbrechen',
        time: '16:00',
        mealType: 'break-fast',
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat,
        status: 'open',
        locked: false,
        completed: false
      }
    ]
    
    // Update the day with fasting day meals
    const updatedPlannedDays = plannedDays.map(day => 
      day.date === dayPlan.date 
        ? { 
            ...day, 
            meals: meals,
            mealPlan: {
              eatingWindow: { start: '16:00', end: '16:00' },
              mealCount: 1,
              lastUpdated: new Date().toISOString()
            }
          }
        : day
    )
    setPlannedDays(updatedPlannedDays)
    
    return meals
  }

  const openMealTracking = (meal: Meal) => {
    setSelectedMeal(meal)
    setShowMealTrackingModal(true)
  }

  const saveMealTracking = (consumedMacros: { calories: number, protein: number, carbs: number, fat: number }) => {
    if (!selectedMeal || !viewingDayPlan) return
    
    const updatedMeals = (viewingDayPlan.meals || []).map(meal => 
      meal.id === selectedMeal.id 
        ? { 
            ...meal, 
            consumedCalories: consumedMacros.calories,
            consumedProtein: consumedMacros.protein,
            consumedCarbs: consumedMacros.carbs,
            consumedFat: consumedMacros.fat,
            status: 'completed' as const
          }
        : meal
    )
    
    // Redistribute remaining macros to untracked meals
    const redistributedMeals = redistributeRemainingMacros(updatedMeals, viewingDayPlan)
    
    const updatedPlannedDays = plannedDays.map(day => 
      day.date === viewingDayPlan.date 
        ? { ...day, meals: redistributedMeals }
        : day
    )
    
    setPlannedDays(updatedPlannedDays)
    setShowMealTrackingModal(false)
    setSelectedMeal(null)
  }

  const untrackMeal = () => {
    if (!selectedMeal || !viewingDayPlan) return
    
    const updatedMeals = (viewingDayPlan.meals || []).map(meal => 
      meal.id === selectedMeal.id 
        ? { 
            ...meal, 
            consumedCalories: undefined,
            consumedProtein: undefined,
            consumedCarbs: undefined,
            consumedFat: undefined,
            status: 'open' as const
          }
        : meal
    )
    
    // Re-initialize meals to get original macro distribution
    const reInitializedMeals = (() => {
      if (viewingDayPlan.type === 'training' && viewingDayPlan.trainingTime) {
        return generateIntelligentMealPlan(viewingDayPlan)
      } else if (viewingDayPlan.type === 'rest') {
        return generateRestDayMealPlan(viewingDayPlan)
      } else if (viewingDayPlan.type === 'fasting') {
        return generateFastingDayMealPlan(viewingDayPlan)
      }
      return updatedMeals
    })()
    
    // Preserve any already tracked meals from the re-initialized meals
    const finalMeals = reInitializedMeals.map(reInitMeal => {
      const existingMeal = updatedMeals.find(meal => meal.id === reInitMeal.id)
      if (existingMeal && existingMeal.consumedCalories !== undefined) {
        // Keep the tracked data
        return existingMeal
      }
      // Use re-initialized values for untracked meals
      return reInitMeal
    })
    
    // Redistribute macros considering the newly untracked meal
    const redistributedMeals = redistributeRemainingMacros(finalMeals, viewingDayPlan)
    
    const updatedPlannedDays = plannedDays.map(day => 
      day.date === viewingDayPlan.date 
        ? { ...day, meals: redistributedMeals }
        : day
    )
    
    setPlannedDays(updatedPlannedDays)
    setShowMealTrackingModal(false)
    setSelectedMeal(null)
  }

  // Function to redistribute remaining macros to untracked meals
  const redistributeRemainingMacros = (meals: Meal[], dayPlan: PlannedDay): Meal[] => {
    const dayMacros = getMacrosForPlannedDay(dayPlan)
    if (!dayMacros) return meals
    
    // Calculate total planned vs total consumed so far
    const totalPlanned = {
      calories: dayMacros.kcal,
      protein: dayMacros.protein,
      carbs: dayMacros.carbs,
      fat: dayMacros.fat
    }
    
    // Calculate what has been consumed (tracked meals)
    const totalConsumed = meals.reduce((acc, meal) => {
      if (meal.consumedCalories !== undefined) {
        acc.calories += meal.consumedCalories
        acc.protein += meal.consumedProtein || 0
        acc.carbs += meal.consumedCarbs || 0
        acc.fat += meal.consumedFat || 0
      }
      return acc
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 })
    
    // Calculate remaining macros needed
    const remaining = {
      calories: Math.max(0, totalPlanned.calories - totalConsumed.calories),
      protein: Math.max(0, totalPlanned.protein - totalConsumed.protein),
      carbs: Math.max(0, totalPlanned.carbs - totalConsumed.carbs),
      fat: Math.max(0, totalPlanned.fat - totalConsumed.fat)
    }
    
    // Find untracked meals
    const untrackedMeals = meals.filter(meal => meal.consumedCalories === undefined)
    
    if (untrackedMeals.length === 0) return meals
    
    // Calculate total original macros of untracked meals for proportional distribution
    const totalUntrackedOriginal = untrackedMeals.reduce((acc, meal) => {
      acc.calories += meal.calories || 0
      acc.protein += meal.protein || 0
      acc.carbs += meal.carbs || 0
      acc.fat += meal.fat || 0
      return acc
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 })
    
    // Redistribute remaining macros proportionally
    return meals.map(meal => {
      if (meal.consumedCalories !== undefined) {
        // Already tracked, don't change
        return meal
      }
      
      // Calculate this meal's proportion of untracked meals
      const proportion = {
        calories: totalUntrackedOriginal.calories > 0 ? (meal.calories || 0) / totalUntrackedOriginal.calories : 1 / untrackedMeals.length,
        protein: totalUntrackedOriginal.protein > 0 ? (meal.protein || 0) / totalUntrackedOriginal.protein : 1 / untrackedMeals.length,
        carbs: totalUntrackedOriginal.carbs > 0 ? (meal.carbs || 0) / totalUntrackedOriginal.carbs : 1 / untrackedMeals.length,
        fat: totalUntrackedOriginal.fat > 0 ? (meal.fat || 0) / totalUntrackedOriginal.fat : 1 / untrackedMeals.length
      }
      
      // Apply proportional redistribution
      return {
        ...meal,
        calories: Math.round(remaining.calories * proportion.calories),
        protein: Math.round(remaining.protein * proportion.protein),
        carbs: Math.round(remaining.carbs * proportion.carbs),
        fat: Math.round(remaining.fat * proportion.fat)
      }
    })
  }

  // Meal Tracking Modal Component
  const MealTrackingModal = () => {
    if (!selectedMeal || !showMealTrackingModal) return null

    // Calculate if this is a past day in the modal context
    const isPastDay = viewingDay < currentDay
    
    const [isEditingName, setIsEditingName] = useState(false)
    const [tempName, setTempName] = useState(selectedMeal.name)
    
    // Current meal macros for editing
    const [consumedCalories, setConsumedCalories] = useState(selectedMeal.consumedCalories || selectedMeal.calories || 0)
    const [consumedProtein, setConsumedProtein] = useState(selectedMeal.consumedProtein || selectedMeal.protein || 0)
    const [consumedCarbs, setConsumedCarbs] = useState(selectedMeal.consumedCarbs || selectedMeal.carbs || 0)
    const [consumedFat, setConsumedFat] = useState(selectedMeal.consumedFat || selectedMeal.fat || 0)
    
    // Auto-calculate calorie unlock when macros are sufficient
    const macrosEntered = consumedProtein > 0 && consumedCarbs >= 0 && consumedFat > 0
    const [caloriesUnlocked, setCaloriesUnlocked] = useState(!macrosEntered)

    // Kalorienwerte pro Gramm
    const CALORIES_PER_PROTEIN = 4
    const CALORIES_PER_CARB = 4
    const CALORIES_PER_FAT = 9

    // Initialize edited name when selectedMeal changes
    useEffect(() => {
      if (selectedMeal) {
        setTempName(selectedMeal.name)
      }
    }, [selectedMeal])

    // Save meal name change
    const saveMealName = () => {
      if (!selectedMeal || !viewingDayPlan || tempName.trim() === '') return
      
      const updatedMeals = (viewingDayPlan.meals || []).map(meal => 
        meal.id === selectedMeal.id 
          ? { ...meal, name: tempName.trim() }
          : meal
      )
      
      const updatedPlannedDays = plannedDays.map(day => 
        day.date === viewingDayPlan.date 
          ? { ...day, meals: updatedMeals }
          : day
      )
      
      setPlannedDays(updatedPlannedDays)
      setIsEditingName(false)
    }

    // Cancel name editing
    const cancelNameEdit = () => {
      setTempName(selectedMeal.name)
      setIsEditingName(false)
    }

    // Automatische Kalorien-Berechnung basierend auf Makros
    const calculateCaloriesFromMacros = (protein: number, carbs: number, fat: number): number => {
      return Math.round(
        (protein * CALORIES_PER_PROTEIN) + 
        (carbs * CALORIES_PER_CARB) + 
        (fat * CALORIES_PER_FAT)
      )
    }

    // Prüfen ob Makros eingegeben wurden
    const checkMacrosEntered = (protein: number, carbs: number, fat: number) => {
      const hasValues = protein > 0 || carbs > 0 || fat > 0
      
      if (hasValues) {
        // Automatisch Kalorien berechnen wenn Makros eingegeben wurden
        const calculatedCalories = calculateCaloriesFromMacros(protein, carbs, fat)
        setConsumedCalories(calculatedCalories)
        
        // Kalorien-Feld nach kurzer Verzögerung freischalten
        setTimeout(() => setCaloriesUnlocked(true), 500)
      } else {
        setCaloriesUnlocked(false)
        setConsumedCalories(selectedMeal?.calories || 0)
      }
    }

    // Validierung: Kalorien dürfen nicht drastisch von berechneten Makros abweichen
    const validateCalories = (): { isValid: boolean, message?: string } => {
      // Removed 15% tolerance validation - users can enter any calorie value
      return { isValid: true }
    }

    // Handler für Makro-Änderungen
    const handleProteinChange = (value: number) => {
      setConsumedProtein(value)
      checkMacrosEntered(value, consumedCarbs, consumedFat)
    }

    const handleCarbsChange = (value: number) => {
      setConsumedCarbs(value)
      checkMacrosEntered(consumedProtein, value, consumedFat)
    }

    const handleFatChange = (value: number) => {
      setConsumedFat(value)
      checkMacrosEntered(consumedProtein, consumedCarbs, value)
    }

    const validation = validateCalories()
    const canSave = macrosEntered // Removed validation.isValid dependency

    if (!selectedMeal) return null

    return (
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowMealTrackingModal(false)}
      >
        <motion.div
          className="bg-dark-secondary rounded-2xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              {isEditingName ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveMealName()
                      if (e.key === 'Escape') cancelNameEdit()
                    }}
                    className="text-xl font-semibold text-white bg-dark-tertiary rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Mahlzeiten-Name"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <motion.button
                      onClick={saveMealName}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg font-medium"
                      whileTap={{ scale: 0.95 }}
                    >
                      ✓
                    </motion.button>
                    <motion.button
                      onClick={cancelNameEdit}
                      className="px-3 py-1 bg-dark-tertiary text-dark-gray-primary text-sm rounded-lg"
                      whileTap={{ scale: 0.95 }}
                    >
                      ✕
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-white">{selectedMeal?.name}</h3>
                    <motion.button
                      onClick={() => setIsEditingName(true)}
                      className="w-6 h-6 rounded-lg bg-dark-tertiary/50 hover:bg-dark-tertiary flex items-center justify-center transition-colors duration-200"
                      whileTap={{ scale: 0.95 }}
                    >
                      <Edit3 className="w-3 h-3 text-dark-gray-primary" strokeWidth={2} />
                    </motion.button>
                  </div>
                  <p className="text-dark-gray-tertiary">
                    {selectedMeal?.consumedCalories !== undefined ? 'Getrackte Makros bearbeiten' : 'Tatsächlich gegessene Makros'}
                  </p>
                </div>
              )}
            </div>
            {!isEditingName && (
              <motion.button
                onClick={() => setShowMealTrackingModal(false)}
                className="w-8 h-8 rounded-lg bg-dark-tertiary flex items-center justify-center ml-3"
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-4 h-4 text-dark-gray-primary" />
              </motion.button>
            )}
          </div>

          {/* Geplante Makros */}
          <div className="mb-6 p-4 bg-dark-tertiary/30 rounded-xl">
            <h4 className="text-sm font-medium text-white mb-3">
              {selectedMeal?.consumedCalories !== undefined ? 'Ursprünglich geplante Makros' : 'Geplante Makros'}
            </h4>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-white">{selectedMeal?.calories}</div>
                <div className="text-xs text-dark-gray-tertiary">kcal</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-400">{selectedMeal?.protein}g</div>
                <div className="text-xs text-dark-gray-tertiary">Protein</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-400">{selectedMeal?.carbs}g</div>
                <div className="text-xs text-dark-gray-tertiary">Carbs</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-400">{selectedMeal?.fat}g</div>
                <div className="text-xs text-dark-gray-tertiary">Fett</div>
              </div>
            </div>
          </div>

          {/* Eingabe für tatsächliche Makros */}
          <div className="space-y-4">
            <NumberInput
              label="Tatsächliches Protein"
              value={consumedProtein}
              onChange={handleProteinChange}
              min={0}
              max={300}
              unit="g"
            />
            
            <NumberInput
              label="Tatsächliche Kohlenhydrate"
              value={consumedCarbs}
              onChange={handleCarbsChange}
              min={0}
              max={500}
              unit="g"
            />
            
            <NumberInput
              label="Tatsächliches Fett"
              value={consumedFat}
              onChange={handleFatChange}
              min={0}
              max={200}
              unit="g"
            />

            {/* Berechnete Kalorien Anzeige */}
            {macrosEntered && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                <div className="text-sm text-green-400 mb-2">
                  ⚡ Automatisch berechnet:
                </div>
                <div className="text-lg font-bold text-white">
                  {calculateCaloriesFromMacros(consumedProtein, consumedCarbs, consumedFat)} kcal
                </div>
                <div className="text-xs text-dark-gray-tertiary mt-1">
                  {consumedProtein}×4 + {consumedCarbs}×4 + {consumedFat}×9
                </div>
              </div>
            )}
            
            <NumberInput
              label="Tatsächliche Kalorien"
              value={consumedCalories}
              onChange={setConsumedCalories}
              min={0}
              max={8000}
              unit=" kcal"
              disabled={!caloriesUnlocked}
              placeholder={!macrosEntered ? "Erst Makros eingeben" : "Wird berechnet..."}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            {/* Skip/Unskip button for ALL meals */}
            {selectedMeal && !isPastDay && (
              <motion.button
                onClick={() => {
                  if (!viewingDayPlan) return
                  
                  if (selectedMeal.skipped) {
                    // Unskip: restore original macros by regenerating meal plan
                    if (viewingDayPlan.type === 'training') {
                      const regeneratedMeals = generateIntelligentMealPlan(viewingDayPlan)
                      const originalMeal = regeneratedMeals.find(m => m.mealType === selectedMeal.mealType)
                      
                      const updatedMeals = (viewingDayPlan.meals || []).map(meal => 
                        meal.id === selectedMeal.id && originalMeal
                          ? { 
                              ...meal, 
                              skipped: false,
                              calories: originalMeal.calories,
                              protein: originalMeal.protein,
                              carbs: originalMeal.carbs,
                              fat: originalMeal.fat
                            }
                          : meal
                      )
                      
                      const redistributedMeals = redistributeRemainingMacros(updatedMeals, viewingDayPlan)
                      
                      const updatedPlannedDays = plannedDays.map(day => 
                        day.date === viewingDayPlan.date 
                          ? { ...day, meals: redistributedMeals }
                          : day
                      )
                      
                      setPlannedDays(updatedPlannedDays)
                    } else {
                      // For rest/fasting days, use simpler approach
                      const updatedMeals = (viewingDayPlan.meals || []).map(meal => 
                        meal.id === selectedMeal.id
                          ? { 
                              ...meal, 
                              skipped: false,
                              calories: meal.calories || 400,
                              protein: meal.protein || 25,
                              carbs: meal.carbs || 40,
                              fat: meal.fat || 15
                            }
                          : meal
                      )
                      
                      const redistributedMeals = redistributeRemainingMacros(updatedMeals, viewingDayPlan)
                      
                      const updatedPlannedDays = plannedDays.map(day => 
                        day.date === viewingDayPlan.date 
                          ? { ...day, meals: redistributedMeals }
                          : day
                      )
                      
                      setPlannedDays(updatedPlannedDays)
                    }
                  } else {
                    // Skip: set macros to 0
                    const updatedMeals = (viewingDayPlan.meals || []).map(meal => 
                      meal.id === selectedMeal.id
                        ? { 
                            ...meal, 
                            skipped: true,
                            calories: 0,
                            protein: 0,
                            carbs: 0,
                            fat: 0
                          }
                        : meal
                    )
                    
                    const redistributedMeals = redistributeRemainingMacros(updatedMeals, viewingDayPlan)
                    
                    const updatedPlannedDays = plannedDays.map(day => 
                      day.date === viewingDayPlan.date 
                        ? { ...day, meals: redistributedMeals }
                        : day
                    )
                    
                    setPlannedDays(updatedPlannedDays)
                  }
                  
                  setShowMealTrackingModal(false)
                  setSelectedMeal(null)
                }}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  selectedMeal.skipped
                    ? 'bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30'
                    : 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/30'
                }`}
                whileTap={{ scale: 0.98 }}
                title={selectedMeal.skipped ? 'Mahlzeit reaktivieren' : 'Mahlzeit überspringen'}
              >
                {selectedMeal.skipped ? '↺' : '⏭'}
              </motion.button>
            )}
            
            {selectedMeal?.consumedCalories !== undefined && (
              <motion.button
                onClick={untrackMeal}
                className="flex-1 bg-red-500/20 border border-red-500/40 text-red-400 py-3 px-4 rounded-xl font-medium hover:bg-red-500/30 transition-all duration-200"
                whileTap={{ scale: 0.98 }}
              >
                Untrack
              </motion.button>
            )}
            <motion.button
              onClick={() => setShowMealTrackingModal(false)}
              className="flex-1 btn-secondary"
              whileTap={{ scale: 0.98 }}
            >
              Abbrechen
            </motion.button>
            <motion.button
              onClick={() => {
                if (canSave) {
                  saveMealTracking({
                    calories: consumedCalories,
                    protein: consumedProtein,
                    carbs: consumedCarbs,
                    fat: consumedFat
                  })
                }
              }}
              disabled={!canSave}
              className={`flex-2 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                canSave 
                  ? 'btn-primary'
                  : 'bg-dark-tertiary/50 text-dark-gray-quaternary cursor-not-allowed opacity-50'
              }`}
              whileTap={{ scale: canSave ? 0.98 : 1 }}
            >
              {selectedMeal?.consumedCalories !== undefined ? 'Update' : 'Speichern'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  // Helper function to get theme colors based on day type
  const getThemeColors = (dayType: 'training' | 'rest' | 'fasting') => {
    switch (dayType) {
      case 'training':
        return {
          primary: 'text-green-400',
          bg: 'bg-gradient-to-br from-green-500/10 to-green-600/5',
          border: 'border-green-500/20',
          gradient: 'bg-gradient-to-br from-green-500 to-green-600',
          headerBg: 'bg-gradient-to-r from-green-500/10 to-green-600/5',
          navBg: 'bg-gradient-to-r from-green-500/5 to-green-600/3',
          selectedBg: 'bg-gradient-to-r from-green-500 to-green-600'
        }
      case 'rest':
        return {
          primary: 'text-blue-400',
          bg: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5',
          border: 'border-blue-500/20',
          gradient: 'bg-gradient-to-br from-blue-500 to-blue-600',
          headerBg: 'bg-gradient-to-r from-blue-500/10 to-blue-600/5',
          navBg: 'bg-gradient-to-r from-blue-500/5 to-blue-600/3',
          selectedBg: 'bg-gradient-to-r from-blue-500 to-blue-600'
        }
      case 'fasting':
        return {
          primary: 'text-red-400',
          bg: 'bg-gradient-to-br from-red-500/10 to-red-600/5',
          border: 'border-red-500/20',
          gradient: 'bg-gradient-to-br from-red-500 to-red-600',
          headerBg: 'bg-gradient-to-r from-red-500/10 to-red-600/5',
          navBg: 'bg-gradient-to-r from-red-500/5 to-red-600/3',
          selectedBg: 'bg-gradient-to-r from-red-500 to-red-600'
        }
    }
  }

  // Confirmation Modal Component
  const ConfirmationModal = () => {
    if (!pendingDayTypeChange) return null

    const currentDayType = dayTypes.find(dt => dt.label === pendingDayTypeChange.currentType)
    const newDayType = dayTypes.find(dt => dt.type === pendingDayTypeChange.dayType.type)

    return (
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          setShowConfirmationModal(false)
          setPendingDayTypeChange(null)
        }}
      >
        <motion.div
          className="bg-dark-secondary rounded-2xl p-6 max-w-md w-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
              <div className="text-2xl">⚠️</div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Tag-Typ wirklich ändern?</h3>
            <p className="text-dark-gray-tertiary text-sm">
              Diese Aktion wird den aktuellen Plan überschreiben
            </p>
          </div>

          {/* Current vs New Type Comparison */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-3 bg-dark-tertiary/30 rounded-xl">
              <div className="text-left">
                <p className="text-xs text-dark-gray-tertiary">Aktuell</p>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${currentDayType?.bgColor}`}></div>
                  <p className="font-medium text-white">{pendingDayTypeChange.currentType}</p>
                </div>
              </div>
              <div className="text-dark-gray-quaternary">→</div>
              <div className="text-right">
                <p className="text-xs text-dark-gray-tertiary">Neu</p>
                <div className="flex items-center gap-2 justify-end">
                  <p className="font-medium text-white">{newDayType?.label}</p>
                  <div className={`w-3 h-3 rounded-full ${newDayType?.bgColor}`}></div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm text-center">
                ⚠️ Alle Mahlzeiten und Einstellungen des aktuellen Plans werden überschrieben
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <motion.button
              onClick={() => {
                setShowConfirmationModal(false)
                setPendingDayTypeChange(null)
                setShowDayTypeModal(true) // Reopen day type modal
              }}
              className="flex-1 py-3 px-4 bg-dark-tertiary text-dark-gray-primary rounded-xl font-medium"
              whileTap={{ scale: 0.98 }}
            >
              Abbrechen
            </motion.button>
            <motion.button
              onClick={() => confirmDayTypeChange(pendingDayTypeChange.dayType)}
              className="flex-2 py-3 px-4 bg-yellow-500 text-white rounded-xl font-medium shadow-lg"
              whileTap={{ scale: 0.98 }}
            >
              Ja, überschreiben
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-primary safe-area">
      {/* Header */}
      <header className={`px-6 py-4 backdrop-blur-apple border-b border-dark-quaternary/30 ${
        viewingDayPlan 
          ? viewingDayPlan.type === 'training'
            ? 'bg-gradient-to-r from-green-500/10 to-green-600/5'
            : viewingDayPlan.type === 'rest'
              ? 'bg-gradient-to-r from-blue-500/10 to-blue-600/5'
              : 'bg-gradient-to-r from-red-500/10 to-red-600/5'
          : 'bg-dark-primary/95'
      }`}>
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
      <div className={`px-6 py-4 border-b border-dark-quaternary/20 ${
        viewingDayPlan 
          ? viewingDayPlan.type === 'training'
            ? 'bg-gradient-to-r from-green-500/5 to-green-600/3'
            : viewingDayPlan.type === 'rest'
              ? 'bg-gradient-to-r from-blue-500/5 to-blue-600/3'
              : 'bg-gradient-to-r from-red-500/5 to-red-600/3'
          : 'bg-dark-secondary/50'
      }`}>
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
                      ? viewingDayPlan?.type === 'training'
                        ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-apple'
                        : viewingDayPlan?.type === 'rest'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-apple'
                          : viewingDayPlan?.type === 'fasting'
                            ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-apple'
                            : 'bg-gradient-to-r from-green-500 to-green-600 shadow-apple'
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
                    className="absolute -bottom-1 left-1/2 w-1.5 h-1.5 bg-white rounded-full" style={{ transform: 'translateX(-50%)' }} />
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
                {viewingDay === currentDay && ' (Heute)'}
                {viewingDay < currentDay && ' (Vergangen)'}
              </h2>
            </div>

            {/* Selected Day's Macro Card - Large and Prominent */}
            <div className={`card relative ${
              viewingDayPlan.type === 'training'
                ? 'bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20'
                : viewingDayPlan.type === 'rest'
                  ? 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20'
                  : 'bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20'
            }`}>
              
              {/* Small Edit Button in top right corner - Only for today */}
              {viewingDay === currentDay && todayPlan && (
                <motion.button
                  onClick={editTodayDayType}
                  disabled={todayPlan.completed}
                  className={`absolute top-4 right-4 w-8 h-8 rounded-lg transition-all duration-200 ${
                    todayPlan.completed 
                      ? 'bg-dark-tertiary/30 text-dark-gray-quaternary cursor-not-allowed opacity-50'
                      : 'bg-dark-tertiary/70 text-dark-gray-primary hover:bg-dark-tertiary backdrop-blur-sm'
                  }`}
                  whileHover={{ scale: todayPlan.completed ? 1 : 1.1 }}
                  whileTap={{ scale: todayPlan.completed ? 1 : 0.9 }}
                  title="Tag-Typ ändern"
                >
                  <Settings className="w-4 h-4 mx-auto" strokeWidth={1.5} />
                </motion.button>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  viewingDayPlan?.type === 'training'
                    ? 'bg-gradient-to-br from-green-500 to-green-600'
                    : viewingDayPlan?.type === 'rest'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                      : 'bg-gradient-to-br from-red-500 to-red-600'
                }`}>
                  <div className="text-white font-bold text-xl">
                    {viewingDayPlan?.type === 'training' ? 'T' : 
                     viewingDayPlan?.type === 'rest' ? 'R' : 
                     'F'}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">{dayTypes.find(dt => dt.type === viewingDayPlan?.type)?.label}</h3>
                  <p className="text-dark-gray-tertiary">
                    {dayTypes.find(dt => dt.type === viewingDayPlan?.type)?.description}
                    {viewingDay < currentDay && ' (Vergangener Tag)'}
                  </p>
                </div>
                
                {/* Compact Training Time Picker - Only for today's training days */}
                {viewingDay === currentDay && todayPlan?.type === 'training' && (
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-sm text-white font-medium">
                        {todayPlan.trainingTime || '18:30'}
                      </div>
                      <div className="text-xs text-dark-gray-tertiary">
                        Trainingszeit
                      </div>
                    </div>
                    <motion.button
                      onClick={() => {
                        // Toggle a simple time picker or direct edit
                        const newTime = prompt('Trainingszeit (HH:MM):', todayPlan.trainingTime || '18:30')
                        if (newTime && /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newTime)) {
                          updateTrainingTime(currentDay, newTime)
                        }
                      }}
                      disabled={todayPlan.completed}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                        todayPlan.completed 
                          ? 'bg-dark-tertiary/30 text-dark-gray-quaternary cursor-not-allowed opacity-50'
                          : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30'
                      }`}
                      whileHover={{ scale: todayPlan.completed ? 1 : 1.1 }}
                      whileTap={{ scale: todayPlan.completed ? 1 : 0.9 }}
                      title="Trainingszeit ändern"
                    >
                      <div className="w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center">
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                      </div>
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Large Calorie Display */}
              <div className="text-center mb-6">
                <div className={`font-bold text-white mb-2 ${
                  (viewingDayMacros?.kcal || 0) >= 10000 ? 'text-2xl' : 
                  (viewingDayMacros?.kcal || 0) >= 1000 ? 'text-3xl' : 'text-4xl'
                }`}>{Math.round(viewingDayMacros?.kcal || 0)}</div>
                <div className={`text-lg font-medium ${
                  viewingDayPlan?.type === 'training'
                    ? 'text-green-400'
                    : viewingDayPlan?.type === 'rest'
                      ? 'text-blue-400'
                      : 'text-red-400'
                }`}>
                  {viewingDay === currentDay 
                    ? 'Verbleibende Kalorien heute' 
                    : viewingDay < currentDay 
                      ? 'Kalorien waren verbleibend'
                      : 'Kalorien verbleibend'
                  }
                  {viewingDayPlan?.completed && viewingDayPlan.originalMacros && (
                    <span className="text-sm block mt-1 opacity-75">
                      {viewingDay < currentDay 
                        ? '(Abgeschlossener Tag mit Original-Werten)'
                        : '(Original-Werte zum Zeitpunkt der Planung)'
                      }
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
                  <div className={`font-bold text-red-400 ${
                    viewingDayMacros.protein >= 1000 ? 'text-lg' : 
                    viewingDayMacros.protein >= 100 ? 'text-xl' : 'text-2xl'
                  }`}>{Math.round(viewingDayMacros.protein)}g</div>
                  <div className="text-sm text-dark-gray-tertiary">Protein verbleibend</div>
                  {/* Progress bar */}
                  {viewingDayOriginalMacros && viewingDayOriginalMacros.protein !== viewingDayMacros.protein && (
                    <div className="mt-2">
                      <div className="h-1 bg-dark-tertiary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-400 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, ((viewingDayOriginalMacros.protein - viewingDayMacros.protein) / viewingDayOriginalMacros.protein) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-dark-gray-quaternary mt-1">
                        {Math.round(viewingDayOriginalMacros.protein - viewingDayMacros.protein)}g getrackt
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-center p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  </div>
                  <div className={`font-bold text-yellow-400 ${
                    viewingDayMacros.carbs >= 1000 ? 'text-lg' : 
                    viewingDayMacros.carbs >= 100 ? 'text-xl' : 'text-2xl'
                  }`}>{Math.round(viewingDayMacros.carbs)}g</div>
                  <div className="text-sm text-dark-gray-tertiary">Carbs verbleibend</div>
                  {/* Progress bar */}
                  {viewingDayOriginalMacros && viewingDayOriginalMacros.carbs !== viewingDayMacros.carbs && (
                    <div className="mt-2">
                      <div className="h-1 bg-dark-tertiary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, ((viewingDayOriginalMacros.carbs - viewingDayMacros.carbs) / viewingDayOriginalMacros.carbs) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-dark-gray-quaternary mt-1">
                        {Math.round(viewingDayOriginalMacros.carbs - viewingDayMacros.carbs)}g getrackt
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  </div>
                  <div className={`font-bold text-blue-400 ${
                    viewingDayMacros.fat >= 1000 ? 'text-lg' : 
                    viewingDayMacros.fat >= 100 ? 'text-xl' : 'text-2xl'
                  }`}>{Math.round(viewingDayMacros.fat)}g</div>
                  <div className="text-sm text-dark-gray-tertiary">Fett verbleibend</div>
                  {/* Progress bar */}
                  {viewingDayOriginalMacros && viewingDayOriginalMacros.fat !== viewingDayMacros.fat && (
                    <div className="mt-2">
                      <div className="h-1 bg-dark-tertiary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-400 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, ((viewingDayOriginalMacros.fat - viewingDayMacros.fat) / viewingDayOriginalMacros.fat) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-dark-gray-quaternary mt-1">
                        {Math.round(viewingDayOriginalMacros.fat - viewingDayMacros.fat)}g getrackt
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badge for past days */}
              {viewingDay < currentDay && (
                <div className="mt-6">
                  <div className={`p-3 rounded-xl text-center ${
                    viewingDayPlan?.completed 
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-yellow-500/10 border border-yellow-500/20'
                  }`}>
                    <p className={`text-sm font-medium ${
                      viewingDayPlan?.completed ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {viewingDayPlan?.completed 
                        ? '✓ Tag wurde erfolgreich abgeschlossen'
                        : '○ Tag wurde gestartet aber nicht abgeschlossen'
                      }
                    </p>
                    <p className="text-xs text-dark-gray-tertiary mt-1">
                      {viewingDayPlan?.completed 
                        ? 'Alle Makros und Daten wurden gespeichert'
                        : 'Ursprünglich geplante Werte werden angezeigt'
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Meals Section - Show for all day types except fasting */}
              {viewingDayPlan && viewingDayPlan.type !== 'fasting' && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-white">
                      {viewingDay < currentDay ? 'Vergangene Mahlzeiten' : 'Mahlzeiten'}
                    </h4>
                  </div>

                  {(() => {
                    const meals = viewingDay === currentDay && todayPlan 
                      ? initializeMealsForDay(todayPlan)
                      : viewingDayPlan.meals || []
                    
                    // Define isPastDay at the function scope level for use in meal operations
                    const isPastDay = viewingDay < currentDay
                    
                    if (meals.length === 0) {
                      return (
                        <div className="text-center py-8 text-dark-gray-tertiary">
                          <div className="text-2xl mb-2">🍽️</div>
                          <p className="text-sm">
                            {viewingDay < currentDay ? 'Keine Mahlzeiten für diesen Tag' : 'Noch keine Mahlzeiten geplant'}
                          </p>
                        </div>
                      )
                    }

                    // Create timeline for display
                    const timeline = createMealTimeline(meals, viewingDayPlan.trainingTime, viewingDayPlan.type)

                    return (
                      <div className="space-y-3">
                        {timeline.map((item: { type: 'meal' | 'training', data: Meal | { time: string, name: string } }, index: number) => {
                          if (item.type === 'training') {
                            const trainingData = item.data as { time: string, name: string }
                            return (
                              <motion.div
                                key={`training-${index}`}
                                className="py-2 px-4 rounded-xl border border-blue-500/30 bg-blue-500/10"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <div className="text-center">
                                  <h5 className="font-medium text-blue-400">
                                    {trainingData.name}
                                  </h5>
                                </div>
                              </motion.div>
                            )
                          } else {
                            const meal = item.data as Meal
                            // isPastDay is now defined at the function scope level
                            const isClickable = !isPastDay || meal.consumedCalories !== undefined
                            const isSkipped = meal.skipped
                            const canDelete = !isPastDay && meal.mealType !== 'pre-short' && meal.mealType !== 'post' && !meal.completed
                            const canSkip = !isPastDay && (meal.mealType === 'pre-short' || meal.mealType === 'post') && !meal.completed
                            
                            // Allow skipped meals of ANY type to remain clickable for unskipping
                            const isSkippedButClickable = isSkipped && !isPastDay
                            
                            return (
                              <motion.div
                                key={meal.id}
                                className={`p-4 rounded-xl border transition-all duration-200 ${
                                  isSkipped 
                                    ? 'opacity-50 bg-dark-tertiary/20 border-dark-quaternary/20' 
                                    : isPastDay ? 'opacity-80' : ''
                                } ${
                                  (isClickable && !isSkipped) || isSkippedButClickable ? 'cursor-pointer' : 'cursor-default'
                                } ${
                                  !isSkipped && meal.status === 'locked'
                                    ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/15'
                                    : !isSkipped && meal.status === 'completed'
                                      ? 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/15'
                                      : !isSkipped 
                                        ? 'bg-dark-tertiary/30 border-dark-quaternary/30 hover:bg-dark-tertiary/50'
                                        : isSkippedButClickable
                                          ? 'hover:bg-dark-tertiary/30' // Add hover effect for skipped but clickable meals
                                          : ''
                                }`}
                                whileHover={{ scale: (isClickable && !isSkipped) || isSkippedButClickable ? 1.01 : 1 }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => {
                                  if ((isClickable && !isPastDay && !isSkipped) || (!isPastDay && isSkippedButClickable)) {
                                    openMealTracking(meal)
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                      isSkipped
                                        ? 'bg-dark-tertiary/50 text-dark-gray-quaternary'
                                        : meal.status === 'locked' 
                                          ? 'bg-green-500/20 text-green-400' 
                                          : meal.status === 'completed'
                                            ? 'bg-blue-500/20 text-blue-400'
                                            : 'bg-dark-secondary text-dark-gray-primary'
                                    }`}>
                                      {isSkipped ? (
                                        <span className="text-dark-gray-quaternary">⏭</span>
                                      ) : (
                                        <Settings 
                                          className={`w-5 h-5 ${
                                            meal.status === 'locked' 
                                              ? 'text-green-400' 
                                              : meal.status === 'completed'
                                                ? 'text-blue-400'
                                                : 'text-dark-gray-primary'
                                          }`} 
                                          strokeWidth={1.5} 
                                        />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <h5 className={`font-medium ${
                                          isSkipped 
                                            ? 'text-dark-gray-quaternary line-through'
                                            : meal.status === 'locked' ? 'text-green-400' : 
                                              meal.status === 'completed' ? 'text-blue-400' :
                                              'text-white'
                                        }`}>
                                          {meal.name}
                                        </h5>
                                        {isSkipped && (
                                          <span className="px-2 py-1 text-xs rounded-full bg-dark-tertiary/50 text-dark-gray-quaternary">
                                            Übersprungen
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        {/* Only show timing hints for pre/post workout meals */}
                                        {meal.mealType === 'pre-short' && (
                                          <p className="text-xs text-yellow-400">
                                            0,5-1,5h vor Training
                                          </p>
                                        )}
                                        {meal.mealType === 'post' && (
                                          <p className="text-xs text-yellow-400">
                                            0,5-1h nach Training
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {((meal.calories || 0) > 0 || isSkipped) && (
                                      <div className="text-right">
                                        <div className={`text-sm font-medium ${
                                          isSkipped ? 'text-dark-gray-quaternary' : 'text-white'
                                        }`}>
                                          {isSkipped ? '0' : (meal.consumedCalories !== undefined ? meal.consumedCalories : meal.calories)} kcal
                                        </div>
                                        {!isSkipped && (
                                          <div className="text-xs text-dark-gray-tertiary space-y-1">
                                            <div>P: {meal.consumedProtein !== undefined ? meal.consumedProtein : meal.protein}g</div>
                                            <div>C: {meal.consumedCarbs !== undefined ? meal.consumedCarbs : meal.carbs}g</div>
                                            <div>F: {meal.consumedFat !== undefined ? meal.consumedFat : meal.fat}g</div>
                                          </div>
                                        )}
                                        {!isSkipped && meal.consumedCalories !== undefined && (
                                          <div className="text-xs text-green-400 mt-1">
                                            ✓ Getrackt
                                          </div>
                                        )}
                                        {!isSkipped && meal.consumedCalories === undefined && (
                                          <div className="text-xs text-dark-gray-quaternary mt-1">
                                            {isPastDay ? 'War geplant' : 'Geplant'}
                                          </div>
                                        )}
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

              {/* Fasting Day Information for past days */}
              {viewingDayPlan && viewingDayPlan.type === 'fasting' && viewingDay < currentDay && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-white">Vergangener Fastentag</h4>
                  </div>
                  
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                    <div className="text-2xl mb-2">🕐</div>
                    <h5 className="font-medium text-red-400 mb-2">
                      {viewingDayPlan.completed ? 'Fastentag erfolgreich abgeschlossen' : 'Fastentag war geplant'}
                    </h5>
                    <p className="text-sm text-dark-gray-tertiary">
                      Alle Tageskalorien in einer Mahlzeit
                    </p>
                    
                    {viewingDayPlan.meals && viewingDayPlan.meals.length > 0 && (
                      <div className="mt-4 p-3 bg-dark-tertiary/30 rounded-lg">
                        <div className="text-sm text-white font-medium">
                          {viewingDayPlan.meals[0].name}: {viewingDayPlan.meals[0].consumedCalories || viewingDayPlan.meals[0].calories} kcal
                        </div>
                        <div className="text-xs text-dark-gray-tertiary mt-1">
                          P: {viewingDayPlan.meals[0].consumedProtein || viewingDayPlan.meals[0].protein}g • 
                          C: {viewingDayPlan.meals[0].consumedCarbs || viewingDayPlan.meals[0].carbs}g • 
                          F: {viewingDayPlan.meals[0].consumedFat || viewingDayPlan.meals[0].fat}g
                        </div>
                        {viewingDayPlan.meals[0].consumedCalories !== undefined && (
                          <div className="text-xs text-green-400 mt-1">✓ Getrackt</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons - Only for today */}
              {viewingDay === currentDay && todayPlan && (
                <div className="space-y-3 mt-6">
                  {/* Hold to Complete Button */}
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
              {viewingDay === currentDay && ' (Heute)'}
              {viewingDay < currentDay && ' (Vergangen)'}
            </h2>
            <div className="card text-center">
              <div className="text-4xl mb-3">
                {viewingDay < currentDay ? '📅' : '📅'}
              </div>
              <h3 className="font-semibold text-white mb-2">
                {viewingDay < currentDay
                  ? `Kein Plan für ${weekDays[viewingDay].full}`
                  : 'Noch kein Plan für heute'
                }
              </h3>
              <p className="text-sm text-dark-gray-tertiary mb-4">
                {viewingDay < currentDay
                  ? 'Dieser Tag ist bereits vergangen.'
                  : 'Wähle einen Tag-Typ um heute zu starten.'
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
        {showHistory && <HistoryModal />}

        {/* Settings Modal */}
        {showSettingsModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettingsModal(false)}
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
                  <h3 className="text-xl font-semibold text-white">Einstellungen</h3>
                  <p className="text-dark-gray-tertiary">Deine Makro-Ziele anpassen</p>
                </div>
                <motion.button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-8 h-8 rounded-lg bg-dark-tertiary flex items-center justify-center"
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-4 h-4 text-dark-gray-primary" />
                </motion.button>
              </div>

              <div className="space-y-4">
                {/* Current Macros Overview */}
                {userMacros && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-white">Aktuelle Makro-Ziele</h4>
                    
                    {/* Training Day Macros */}
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <h5 className="font-medium text-green-400">Trainingstag</h5>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div>
                          <div className="text-lg font-bold text-white">{userMacros.training.kcal}</div>
                          <div className="text-xs text-dark-gray-tertiary">kcal</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-red-400">{userMacros.training.protein}g</div>
                          <div className="text-xs text-dark-gray-tertiary">Protein</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-yellow-400">{userMacros.training.carbs}g</div>
                          <div className="text-xs text-dark-gray-tertiary">Carbs</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-400">{userMacros.training.fat}g</div>
                          <div className="text-xs text-dark-gray-tertiary">Fett</div>
                        </div>
                      </div>
                    </div>

                    {/* Rest Day Macros */}
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <h5 className="font-medium text-blue-400">Ruhetag</h5>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div>
                          <div className="text-lg font-bold text-white">{userMacros.rest.kcal}</div>
                          <div className="text-xs text-dark-gray-tertiary">kcal</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-red-400">{userMacros.rest.protein}g</div>
                          <div className="text-xs text-dark-gray-tertiary">Protein</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-yellow-400">{userMacros.rest.carbs}g</div>
                          <div className="text-xs text-dark-gray-tertiary">Carbs</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-400">{userMacros.rest.fat}g</div>
                          <div className="text-xs text-dark-gray-tertiary">Fett</div>
                        </div>
                      </div>
                    </div>

                    {/* Fasting Day Macros */}
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        </div>
                        <h5 className="font-medium text-red-400">Fastentag</h5>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div>
                          <div className="text-lg font-bold text-white">{userMacros.fasting.kcal}</div>
                          <div className="text-xs text-dark-gray-tertiary">kcal</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-red-400">{userMacros.fasting.protein}g</div>
                          <div className="text-xs text-dark-gray-tertiary">Protein</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-yellow-400">{userMacros.fasting.carbs}g</div>
                          <div className="text-xs text-dark-gray-tertiary">Carbs</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-400">{userMacros.fasting.fat}g</div>
                          <div className="text-xs text-dark-gray-tertiary">Fett</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Button */}
                <motion.button
                  onClick={openEditMacros}
                  className="w-full p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Settings className="w-5 h-5" strokeWidth={1.5} />
                    Makros bearbeiten
                  </div>
                </motion.button>

                {/* Info Text */}
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <p className="text-sm text-yellow-400">
                    ⚠️ Änderungen an den Makros wirken sich nur auf zukünftige und unvollständige Tage aus. 
                    Bereits abgeschlossene Tage behalten ihre ursprünglichen Werte.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Edit Macros Modal */}
        {showEditMacrosModal && editingMacros && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cancelEditMacros}
          >
            <motion.div
              className="bg-dark-secondary rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white">Makros bearbeiten</h3>
                  <p className="text-dark-gray-tertiary">Passe deine Makro-Ziele an</p>
                </div>
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
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <h4 className="text-lg font-medium text-green-400">Trainingstag</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <NumberInput
                      label="Kalorien"
                      value={editingMacros.training.kcal}
                      onChange={(value) => setEditingMacros({
                        ...editingMacros,
                        training: { ...editingMacros.training, kcal: value }
                      })}
                      min={1000}
                      max={8000}
                      unit="kcal"
                    />
                    <NumberInput
                      label="Protein"
                      value={editingMacros.training.protein}
                      onChange={(value) => setEditingMacros({
                        ...editingMacros,
                        training: { ...editingMacros.training, protein: value }
                      })}
                      min={50}
                      max={300}
                      unit="g"
                    />
                    <NumberInput
                      label="Kohlenhydrate"
                      value={editingMacros.training.carbs}
                      onChange={(value) => setEditingMacros({
                        ...editingMacros,
                        training: { ...editingMacros.training, carbs: value }
                      })}
                      min={50}
                      max={500}
                      unit="g"
                    />
                    <NumberInput
                      label="Fett"
                      value={editingMacros.training.fat}
                      onChange={(value) => setEditingMacros({
                        ...editingMacros,
                        training: { ...editingMacros.training, fat: value }
                      })}
                      min={30}
                      max={200}
                      unit="g"
                    />
                  </div>
                </div>

                {/* Rest Day Macros */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <h4 className="text-lg font-medium text-blue-400">Ruhetag</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <NumberInput
                      label="Kalorien"
                      value={editingMacros.rest.kcal}
                      onChange={(value) => setEditingMacros({
                        ...editingMacros,
                        rest: { ...editingMacros.rest, kcal: value }
                      })}
                      min={1000}
                      max={8000}
                      unit="kcal"
                    />
                    <NumberInput
                      label="Protein"
                      value={editingMacros.rest.protein}
                      onChange={(value) => setEditingMacros({
                        ...editingMacros,
                        rest: { ...editingMacros.rest, protein: value }
                      })}
                      min={50}
                      max={300}
                      unit="g"
                    />
                    <NumberInput
                      label="Kohlenhydrate"
                      value={editingMacros.rest.carbs}
                      onChange={(value) => setEditingMacros({
                        ...editingMacros,
                        rest: { ...editingMacros.rest, carbs: value }
                      })}
                      min={20}
                      max={300}
                      unit="g"
                    />
                    <NumberInput
                      label="Fett"
                      value={editingMacros.rest.fat}
                      onChange={(value) => setEditingMacros({
                        ...editingMacros,
                        rest: { ...editingMacros.rest, fat: value }
                      })}
                      min={40}
                      max={200}
                      unit="g"
                    />
                  </div>
                </div>

                {/* Fasting Day Macros */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                    <h4 className="text-lg font-medium text-red-400">Fastentag</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <NumberInput
                      label="Kalorien"
                      value={editingMacros.fasting.kcal}
                      onChange={(value) => setEditingMacros({
                        ...editingMacros,
                        fasting: { ...editingMacros.fasting, kcal: value }
                      })}
                      min={500}
                      max={4000}
                      unit="kcal"
                    />
                    <NumberInput
                      label="Protein"
                      value={editingMacros.fasting.protein}
                      onChange={(value) => setEditingMacros({
                        ...editingMacros,
                        fasting: { ...editingMacros.fasting, protein: value }
                      })}
                      min={30}
                      max={150}
                      unit="g"
                    />
                    <NumberInput
                      label="Kohlenhydrate"
                      value={editingMacros.fasting.carbs}
                      onChange={(value) => setEditingMacros({
                        ...editingMacros,
                        fasting: { ...editingMacros.fasting, carbs: value }
                      })}
                      min={20}
                      max={200}
                      unit="g"
                    />
                    <NumberInput
                      label="Fett"
                      value={editingMacros.fasting.fat}
                      onChange={(value) => setEditingMacros({
                        ...editingMacros,
                        fasting: { ...editingMacros.fasting, fat: value }
                      })}
                      min={20}
                      max={100}
                      unit="g"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-8">
                <motion.button
                  onClick={cancelEditMacros}
                  className="flex-1 py-3 px-4 bg-dark-tertiary text-dark-gray-primary rounded-xl font-medium"
                  whileTap={{ scale: 0.98 }}
                >
                  Abbrechen
                </motion.button>
                <motion.button
                  onClick={saveEditedMacros}
                  className="flex-2 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium shadow-lg"
                  whileTap={{ scale: 0.98 }}
                >
                  Speichern
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
        
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
        
        {showMealTrackingModal && <MealTrackingModal />}
        
        {showConfirmationModal && <ConfirmationModal />}
      </AnimatePresence>
    </div>
  )
} 
