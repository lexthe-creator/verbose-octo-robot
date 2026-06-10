import { useState } from 'react'
import {
  MEAL_SLOTS,
  getMealSlotEntries,
  getNutritionEntriesForDate,
  getNutritionTotals,
  useNutrition,
} from '../../context/index.js'
import {
  PlannerActionButton,
  PlannerActionRow,
  PlannerRow,
} from '../../components/planner/PlannerPrimitives.jsx'
import { getTodayISO, loadDailyHealth, saveDailyHealth } from './healthUtils.js'
import { healthStyles as s } from './healthStyles.js'

export default function HealthNutrition({ onOpenNutrition }) {
  const { nutritionState } = useNutrition()
  const today = getTodayISO()
  const [daily, setDaily] = useState(() => loadDailyHealth(today))
  const entries = getNutritionEntriesForDate(nutritionState, today)
  const totals = getNutritionTotals(entries)
  const loggedMeals = MEAL_SLOTS
    .map(slot => ({ slot, count: getMealSlotEntries(entries, slot).length }))
    .filter(meal => meal.count > 0)
  const nextMeal = MEAL_SLOTS.find(slot => getMealSlotEntries(entries, slot).length === 0) ?? 'food log'
  const hydrationTarget = 8

  function addWater() {
    const next = { ...daily, water: Math.min(hydrationTarget, daily.water + 1) }
    setDaily(next)
    saveDailyHealth(today, next)
  }

  return (
    <section style={s.healthSection} aria-labelledby="health-nutrition-title">
      <header style={s.sectionHeader}>
        <p style={s.sectionLabel}>nutrition</p>
        <h2 id="health-nutrition-title" style={s.sectionTitle}>fuel plan</h2>
      </header>

      <div style={s.block}>
        <PlannerRow label="calories" value={`${Math.round(totals.calories)}`} detail={`${entries.length} foods`} />
        <PlannerRow label="protein" value={`${Math.round(totals.protein)}g`} detail="today" />
        <PlannerRow label="water" value={`${daily.water}/${hydrationTarget}`} />
        <PlannerRow
          label="meals"
          value={loggedMeals.length ? `${loggedMeals.length}/${MEAL_SLOTS.length} logged` : 'open'}
          detail={loggedMeals.map(meal => meal.slot).join(', ') || nextMeal}
        />
        <PlannerRow label="next" value={nextMeal} detail="manual log" />
        <PlannerActionRow style={s.secondaryActions}>
          <PlannerActionButton onClick={onOpenNutrition}>open food log</PlannerActionButton>
          <PlannerActionButton secondary onClick={addWater}>water</PlannerActionButton>
        </PlannerActionRow>
      </div>
    </section>
  )
}
