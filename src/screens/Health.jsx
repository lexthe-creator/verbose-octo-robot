import { useState } from 'react'
import { useFitness } from '../context/index.js'
import Nutrition from './Nutrition.jsx'
import HealthInsights from './health/HealthInsights.jsx'
import { LogWorkoutSheet, PlanSetupSheet } from './health/HealthSheets.jsx'
import HealthToday from './health/HealthToday.jsx'
import HealthTraining from './health/HealthTraining.jsx'
import { SECTION_LABELS, SECTIONS } from './health/healthUtils.js'
import { healthStyles as s } from './health/healthStyles.js'

export default function Health({ onStartWorkout }) {
  const [section, setSection] = useState('today')
  const [sheet, setSheet] = useState(null)
  const { fitnessState } = useFitness()

  return (
    <div style={s.screen}>
      <div style={s.top}>
        <header style={s.topHeader}>
          <p style={s.topEyebrow}>health</p>
        </header>
        <div style={s.tabs} aria-label="health sections">
          {SECTIONS.map(item => (
            <button
              key={item}
              style={{ ...s.tab, ...(section === item ? s.tabActive : {}) }}
              onClick={() => setSection(item)}
              type="button"
              aria-current={section === item ? 'page' : undefined}
            >
              <span style={{ ...s.tabDot, ...(section === item ? s.tabDotActive : {}) }} aria-hidden="true" />
              <span>{SECTION_LABELS[item]}</span>
            </button>
          ))}
        </div>
      </div>

      {section === 'today' && (
        <HealthToday
          onSectionChange={setSection}
          onStartWorkout={onStartWorkout}
          onLogWorkout={() => setSheet('log')}
        />
      )}
      {section === 'training' && (
        <HealthTraining
          configured={fitnessState.program.configured}
          onCreatePlan={() => setSheet('plan')}
          onLogWorkout={() => setSheet('log')}
          onStartWorkout={onStartWorkout}
        />
      )}
      {section === 'nutrition' && <Nutrition />}
      {section === 'insights' && <HealthInsights />}
      {sheet === 'plan' && <PlanSetupSheet onClose={() => setSheet(null)} />}
      {sheet === 'log' && <LogWorkoutSheet onClose={() => setSheet(null)} />}
    </div>
  )
}
