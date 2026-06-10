import { useState } from 'react'
import { useDay } from '../../context/index.js'
import {
  FEEL_OPTIONS,
  getReadiness,
  getTodayISO,
  loadDailyHealth,
  saveDailyHealth,
} from './healthUtils.js'
import { healthStyles as s } from './healthStyles.js'
import { PlannerRow } from '../../components/planner/PlannerPrimitives.jsx'

function CheckInButtons({ label, value, onChange }) {
  return (
    <div style={s.checkRow}>
      <span style={s.checkLabel}>{label}</span>
      <div style={s.segment}>
        {FEEL_OPTIONS.map(option => (
          <button
            key={option.value}
            style={{ ...s.segmentButton, ...(value === option.value ? s.segmentActive : {}) }}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function PlannerGroup({ label, children }) {
  return (
    <div style={s.plannerGroup}>
      <p style={s.groupLabel}>{label}</p>
      <div style={s.groupRows}>
        {children}
      </div>
    </div>
  )
}

export default function HealthToday({
  title = 'recovery',
}) {
  const today = getTodayISO()
  const { dayState, dayDispatch } = useDay()
  const [daily, setDaily] = useState(() => loadDailyHealth(today))

  const energy = dayState.energyLevel ?? daily.energy ?? null
  const readiness = getReadiness(energy, daily.soreness)
  const recoveryStatus = daily.soreness >= 5 ? 'needs care' : daily.soreness ? 'clear enough' : 'not checked'

  function updateDaily(patch) {
    const next = { ...daily, ...patch }
    setDaily(next)
    saveDailyHealth(today, next)
  }

  function updateEnergy(value) {
    dayDispatch({ type: 'SET_ENERGY', payload: value })
    updateDaily({ energy: value })
  }

  return (
    <section style={s.healthSection} aria-labelledby="health-recovery-title">
      <header style={s.sectionHeader}>
        <p style={s.sectionLabel}>recovery</p>
        <h2 id="health-recovery-title" style={s.sectionTitle}>{title}</h2>
      </header>
      <div style={s.block}>
        <PlannerGroup label="check-in">
          <PlannerRow label="sleep" value="add later" />
          <PlannerRow label="energy" value={energy ? `${energy}/5` : 'check in'} />
          <PlannerRow label="readiness" value={readiness === 'check in' ? 'pending' : readiness} detail={recoveryStatus === 'not checked' ? '' : recoveryStatus} />
          <PlannerRow label="motivation" value={daily.motivation ? `${daily.motivation}/5` : 'check in'} />
          <PlannerRow label="soreness" value={daily.soreness ? `${daily.soreness}/5` : 'check in'} />
          <CheckInButtons label="energy" value={energy} onChange={updateEnergy} />
          <CheckInButtons label="soreness" value={daily.soreness} onChange={value => updateDaily({ soreness: value })} />
          <CheckInButtons label="motivation" value={daily.motivation} onChange={value => updateDaily({ motivation: value })} />
        </PlannerGroup>
      </div>
    </section>
  )
}
