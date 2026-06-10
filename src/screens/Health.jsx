import { useRef, useState } from 'react'
import { useFitness } from '../context/index.js'
import { SCREENS } from '../constants/navigation.js'
import HealthInsights from './health/HealthInsights.jsx'
import HealthNutrition from './health/HealthNutrition.jsx'
import { LogWorkoutSheet, PlanSetupSheet } from './health/HealthSheets.jsx'
import HealthToday from './health/HealthToday.jsx'
import HealthTraining from './health/HealthTraining.jsx'
import { healthStyles as s } from './health/healthStyles.js'

export default function Health({ onStartWorkout, onNavigate }) {
  const [sheet, setSheet] = useState(null)
  const weeklyRef = useRef(null)
  const { fitnessState } = useFitness()

  function scrollToSection(ref) {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div style={s.screen}>
      <div style={s.top}>
        <header style={s.topHeader}>
          <p style={s.topEyebrow}>health</p>
        </header>
      </div>

      <div style={s.healthPage}>
        <HealthTraining
          variant="today"
          configured={fitnessState.program.configured}
          onCreatePlan={() => setSheet('plan')}
          onLogWorkout={() => setSheet('log')}
          onStartWorkout={onStartWorkout}
          onOpenWeekly={() => scrollToSection(weeklyRef)}
        />
        <HealthNutrition onOpenNutrition={() => onNavigate?.(SCREENS.NUTRITION)} />
        <HealthToday />
        <div ref={weeklyRef} style={s.sectionAnchor}>
          <HealthTraining
            configured={fitnessState.program.configured}
            onCreatePlan={() => setSheet('plan')}
            onLogWorkout={() => setSheet('log')}
            onStartWorkout={onStartWorkout}
          />
        </div>
        <HealthInsights />
      </div>
      {sheet === 'plan' && <PlanSetupSheet onClose={() => setSheet(null)} />}
      {sheet === 'log' && <LogWorkoutSheet onClose={() => setSheet(null)} />}
    </div>
  )
}
