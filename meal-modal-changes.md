# Meal Detail Modal Implementation

## 1. Add State Variables (around line 133)

```typescript
  // Meal detail modal state
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null)
  const [showMealModal, setShowMealModal] = useState(false)
```

## 2. Add Meal Handlers (after updateTrainingTime function, around line 1327)

```typescript
  // Handle meal click to show detail modal
  const handleMealClick = (meal: Meal) => {
    setSelectedMeal(meal)
    setShowMealModal(true)
  }

  // Close meal modal
  const closeMealModal = () => {
    setShowMealModal(false)
    setSelectedMeal(null)
  }
```

## 3. Make Meal Cards Clickable (around line 1695)

Replace the meal motion.div with:
```typescript
<motion.div
  key={meal.id}
  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
    meal.status === 'locked'
      ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/15'
      : meal.status === 'completed'
        ? 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/15'
        : 'bg-dark-tertiary/30 border-dark-quaternary/30 hover:bg-dark-tertiary/50'
  }`}
  whileHover={{ scale: 1.01 }}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.1 }}
  onClick={() => handleMealClick(meal)}
>
```

## 4. Add Meal Detail Modal (in AnimatePresence, around line 1940)

```typescript
{showMealModal && selectedMeal && (
  <motion.div
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={closeMealModal}
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
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            selectedMeal.mealType === 'pre-long' ? 'bg-gradient-to-br from-green-500 to-green-600' :
            selectedMeal.mealType === 'pre-short' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
            selectedMeal.mealType === 'post' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
            selectedMeal.mealType === 'recovery' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
            'bg-gradient-to-br from-gray-500 to-gray-600'
          }`}>
            <span className="text-xl">
              {selectedMeal.mealType === 'pre-long' ? '🥗' :
               selectedMeal.mealType === 'pre-short' ? '⚡' :
               selectedMeal.mealType === 'post' ? '💪' :
               selectedMeal.mealType === 'recovery' ? '🌙' :
               '🍽️'}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{selectedMeal.name}</h3>
            <p className="text-sm text-dark-gray-tertiary">
              {selectedMeal.mealType === 'pre-long' ? 'Langsame Kohlenhydrate 3-4h vor Training' :
               selectedMeal.mealType === 'pre-short' ? 'Schnelle Carbs 1-1.5h vor Training' :
               selectedMeal.mealType === 'post' ? 'Regeneration im anabolen Fenster' :
               selectedMeal.mealType === 'recovery' ? 'Langsame Carbs für Erholung' :
               'Reguläre Mahlzeit'}
            </p>
          </div>
        </div>
        <motion.button
          onClick={closeMealModal}
          className="w-8 h-8 rounded-lg bg-dark-tertiary flex items-center justify-center"
          whileTap={{ scale: 0.95 }}
        >
          <X className="w-4 h-4 text-dark-gray-primary" />
        </motion.button>
      </div>

      {/* Time Info */}
      {(selectedMeal.time || selectedMeal.relativeToTraining) && (
        <div className="p-4 rounded-xl mb-6 bg-blue-500/10 border border-blue-500/30">
          <h4 className="font-medium text-white mb-2">⏰ Timing</h4>
          <div className="space-y-2">
            {selectedMeal.time && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-gray-tertiary">Geplante Zeit:</span>
                <span className="text-sm font-medium text-white">{selectedMeal.time} Uhr</span>
              </div>
            )}
            {selectedMeal.relativeToTraining && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-gray-tertiary">Relativ zum Training:</span>
                <span className="text-sm font-medium text-blue-400">{selectedMeal.relativeToTraining}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Macro Targets */}
      {(selectedMeal.calories || 0) > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-white mb-4">🎯 Makronährstoff-Ziele</h4>
          
          {/* Calories */}
          <div className="text-center mb-6 p-4 bg-dark-tertiary/30 rounded-xl">
            <div className="text-3xl font-bold text-white mb-1">{selectedMeal.calories}</div>
            <div className="text-sm text-dark-gray-tertiary">Kalorien</div>
          </div>

          {/* Macro breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-red-500/10 rounded-xl border border-red-500/20">
              <div className="text-lg font-bold text-red-400">{selectedMeal.protein}g</div>
              <div className="text-xs text-dark-gray-tertiary">Protein</div>
            </div>
            <div className="text-center p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <div className="text-lg font-bold text-yellow-400">{selectedMeal.carbs}g</div>
              <div className="text-xs text-dark-gray-tertiary">Carbs</div>
            </div>
            <div className="text-center p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <div className="text-lg font-bold text-blue-400">{selectedMeal.fat}g</div>
              <div className="text-xs text-dark-gray-tertiary">Fett</div>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {selectedMeal.warnings && selectedMeal.warnings.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-white mb-3">⚠️ Wichtige Hinweise</h4>
          <div className="space-y-2">
            {selectedMeal.warnings.map((warning, idx) => (
              <div key={idx} className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <p className="text-sm text-orange-400 flex items-center gap-2">
                  <span>⚠️</span>
                  {warning}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <motion.button
          onClick={closeMealModal}
          className="flex-1 py-3 px-4 bg-dark-tertiary text-white rounded-xl font-medium"
          whileTap={{ scale: 0.98 }}
        >
          Schließen
        </motion.button>
        {viewingDay === currentDay && !todayPlan?.completed && (
          <motion.button
            onClick={closeMealModal}
            className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl font-medium"
            whileTap={{ scale: 0.98 }}
          >
            Bearbeiten
          </motion.button>
        )}
      </div>
    </motion.div>
  </motion.div>
)} 