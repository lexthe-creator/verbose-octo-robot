export const MEAL_SLOTS = ['breakfast', 'lunch', 'snack', 'dinner']

export function toNutritionNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

export function getNutritionTotals(entries = []) {
  return entries.reduce((totals, entry) => ({
    calories: totals.calories + toNutritionNumber(entry.calories),
    protein:  totals.protein  + toNutritionNumber(entry.protein),
    carbs:    totals.carbs    + toNutritionNumber(entry.carbs),
    fat:      totals.fat      + toNutritionNumber(entry.fat),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
}

export function getMealSlotEntries(entries = [], mealSlot) {
  return entries.filter(entry => entry.mealSlot === mealSlot)
}

export function getLoggedMealSlotCount(entries = []) {
  return MEAL_SLOTS.filter(slot => entries.some(entry => entry.mealSlot === slot)).length
}

export function getNutritionProgress(entries = []) {
  return getLoggedMealSlotCount(entries) / MEAL_SLOTS.length
}

export function getNutritionStatusSymbol(entries = []) {
  const count = getLoggedMealSlotCount(entries)
  if (count === 0) return '○'
  if (count >= MEAL_SLOTS.length) return '☑'
  return '◐'
}
