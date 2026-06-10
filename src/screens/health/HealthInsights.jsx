import { useMemo } from 'react'
import {
  getNutritionEntriesForDate,
  getNutritionTotals,
  useFitness,
  useNutrition,
} from '../../context/index.js'
import { getTodayISO, getWeekDates } from './healthUtils.js'
import { healthStyles as s } from './healthStyles.js'
import { PlannerRow } from '../../components/planner/PlannerPrimitives.jsx'

export default function HealthInsights() {
  const { fitnessState } = useFitness()
  const { nutritionState } = useNutrition()
  const todayEntries = getNutritionEntriesForDate(nutritionState, getTodayISO())
  const totals = getNutritionTotals(todayEntries)
  const weekDates = useMemo(() => getWeekDates(), [])
  const completedThisWeek = fitnessState.workoutLog.filter(entry =>
    weekDates.some(date => entry.date === date.toISOString().slice(0, 10))
  ).length

  return (
    <main style={s.simpleScreen}>
      <header style={s.header}>
        <p style={s.eyebrow}>insights</p>
        <h1 style={s.title}>Light trends</h1>
      </header>
      <section style={s.block}>
        <PlannerRow label="sleep" value="pending" detail="source later" />
        <PlannerRow label="workouts" value={`${completedThisWeek}`} detail="this week" />
        <PlannerRow label="protein" value={`${Math.round(totals.protein)}g`} detail="today" />
        <PlannerRow label="hydration" value="today only" detail="trend later" />
        <PlannerRow label="weight" value="pending" detail="metric later" />
        <PlannerRow label="recovery" value="check-ins" detail="expands later" />
      </section>
    </main>
  )
}
