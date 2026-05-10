import { useState, useRef } from 'react'
import { useFitness }   from '../context/index.js'
import { useSettings }  from '../context/SettingsContext.jsx'
import { getTodayISO }  from '../utils/time.js'
import { getPhase, getWeekNumber } from '../utils/fitness.js'
import { PHASE_LABELS, GYM_ACCESS } from '../constants/fitness.js'

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 7

const PROGRAM_OPTIONS = [
  {
    id:    'strength',
    title: 'Build Strength',
    lines: ['Progressive resistance training.', 'Get stronger every week.'],
    tags:  ['Upper', 'Lower', 'Full Body'],
  },
  {
    id:    'endurance',
    title: 'Build Endurance',
    lines: ['Aerobic base and running volume.', 'Go further, feel better.'],
    tags:  ['Easy Run', 'Tempo', 'Long Run'],
  },
  {
    id:    'general',
    title: 'General Fitness',
    lines: ['Balanced strength and cardio.', 'The all-rounder program.'],
    tags:  ['Run', 'Strength', 'Mobility'],
  },
  {
    id:    'fat_loss',
    title: 'Fat Loss',
    lines: ['High volume metabolic training.', 'Move more, recover well.'],
    tags:  ['Run', 'Full Body', 'HIIT'],
  },
]

const WEEKLY_DAY_COUNTS = [3, 4, 5, 6, 7]

const DAYS_OF_WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

const DAY_ABBR = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu',
  fri: 'Fri', sat: 'Sat', sun: 'Sun',
}

const DAY_NAME = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}

const PROGRAM_DAY_TYPES = {
  strength: [
    { id: 'upper',     label: 'Upper'     },
    { id: 'lower',     label: 'Lower'     },
    { id: 'full_body', label: 'Full Body' },
    { id: 'push',      label: 'Push'      },
    { id: 'pull',      label: 'Pull'      },
    { id: 'mobility',  label: 'Mobility'  },
  ],
  endurance: [
    { id: 'run_easy',  label: 'Easy Run'  },
    { id: 'run_tempo', label: 'Tempo Run' },
    { id: 'run_long',  label: 'Long Run'  },
    { id: 'strength',  label: 'Strength'  },
    { id: 'mobility',  label: 'Mobility'  },
  ],
  general: [
    { id: 'run_easy',  label: 'Easy Run'  },
    { id: 'upper',     label: 'Upper'     },
    { id: 'lower',     label: 'Lower'     },
    { id: 'full_body', label: 'Full Body' },
    { id: 'mobility',  label: 'Mobility'  },
  ],
  fat_loss: [
    { id: 'run_easy',  label: 'Easy Run'  },
    { id: 'full_body', label: 'Full Body' },
    { id: 'upper',     label: 'Upper'     },
    { id: 'lower',     label: 'Lower'     },
    { id: 'mobility',  label: 'Mobility'  },
  ],
}

// First N entries of each sequence are applied as smart defaults for N training days.
const SMART_DEFAULTS = {
  strength: ['upper', 'lower', 'upper', 'lower', 'full_body', 'push', 'pull'],
  endurance: ['run_easy', 'strength', 'run_tempo', 'run_long', 'mobility', 'run_easy', 'strength'],
  general:  ['run_easy', 'upper', 'lower', 'full_body', 'mobility', 'run_easy', 'upper'],
  fat_loss: ['run_easy', 'full_body', 'upper', 'lower', 'mobility', 'run_easy', 'full_body'],
}

const TYPE_LABEL = {
  upper:     'Upper',    lower:     'Lower',    full_body: 'Full Body',
  push:      'Push',     pull:      'Pull',     mobility:  'Mobility',
  run_easy:  'Easy Run', run_tempo: 'Tempo Run', run_long:  'Long Run',
  strength:  'Strength',
}

const PROGRAM_LABEL = {
  strength: 'Build Strength', endurance: 'Build Endurance',
  general:  'General Fitness', fat_loss:  'Fat Loss',
}

const EQUIPMENT_OPTIONS = [
  {
    value: GYM_ACCESS.BODYWEIGHT,
    title: 'Bodyweight only',
    desc:  'No equipment needed. Anywhere, anytime.',
  },
  {
    value: GYM_ACCESS.DUMBBELLS,
    title: 'Dumbbells',
    desc:  'Dumbbells and bodyweight. Home gym ready.',
  },
  {
    value: GYM_ACCESS.GYM,
    title: 'Full gym',
    desc:  'Full equipment access. Barbells, cables, machines.',
  },
]

// ─── Step 1 — Choose program ──────────────────────────────────────────────────

function Step1({ selectedProgram, onSelect }) {
  return (
    <div style={sc.stepWrap}>
      <div style={sc.heading}>
        <h1 style={sc.h1}>What's your goal?</h1>
        <p style={sc.sub}>This shapes your entire program.</p>
      </div>
      <div style={sc.cardList}>
        {PROGRAM_OPTIONS.map(prog => {
          const active = selectedProgram === prog.id
          return (
            <button
              key={prog.id}
              style={{
                ...sc.programCard,
                background: active ? 'var(--color-accent-bg)' : 'var(--color-card)',
                border:     active ? '1.5px solid var(--color-accent)' : 'var(--border)',
              }}
              onClick={() => onSelect(prog.id)}
            >
              <p style={sc.programTitle}>{prog.title}</p>
              <p style={sc.programDesc}>{prog.lines[0]} {prog.lines[1]}</p>
              <div style={sc.tagRow}>
                {prog.tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      ...sc.tag,
                      color:      active ? 'var(--color-accent)' : 'var(--color-muted)',
                      border:     active ? '0.5px solid var(--color-accent)' : 'var(--border)',
                      background: active ? 'var(--color-accent-bg)' : 'transparent',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 2 — Days per week ───────────────────────────────────────────────────

function Step2({ weeklyDays, onSelect, recommendedSplit }) {
  return (
    <div style={sc.stepWrap}>
      <div style={sc.heading}>
        <h1 style={sc.h1}>How many days per week?</h1>
        <p style={sc.sub}>Be realistic — consistency beats perfection.</p>
      </div>
      <div style={sc.pillRow}>
        {WEEKLY_DAY_COUNTS.map(n => {
          const active = weeklyDays === n
          return (
            <button
              key={n}
              style={{
                ...sc.countPill,
                background: active ? 'var(--color-accent)' : 'var(--color-card)',
                color:      active ? '#fff' : 'var(--color-muted)',
                border:     active ? 'none' : 'var(--border)',
              }}
              onClick={() => onSelect(n)}
            >
              {n}
            </button>
          )
        })}
      </div>
      {recommendedSplit && (
        <div style={sc.splitHint}>
          <p style={sc.splitLabel}>Recommended</p>
          <p style={sc.splitValue}>{recommendedSplit}</p>
        </div>
      )}
    </div>
  )
}

// ─── Step 3 — Which days ──────────────────────────────────────────────────────

function Step3({ selectedDays, weeklyDays, onToggle }) {
  return (
    <div style={sc.stepWrap}>
      <div style={sc.heading}>
        <h1 style={sc.h1}>Which days will you train?</h1>
        <p style={sc.sub}>Pick exactly {weeklyDays} day{weeklyDays !== 1 ? 's' : ''}.</p>
      </div>
      <div style={sc.dayPillRow}>
        {DAYS_OF_WEEK.map(day => {
          const active = selectedDays.includes(day)
          return (
            <button
              key={day}
              style={{
                ...sc.dayPill,
                background: active ? 'var(--color-accent)' : 'var(--color-card)',
                color:      active ? '#fff' : 'var(--color-muted)',
                border:     active ? 'none' : 'var(--border)',
              }}
              onClick={() => onToggle(day)}
            >
              {DAY_ABBR[day]}
            </button>
          )
        })}
      </div>
      <p style={sc.helpText}>
        {selectedDays.length} of {weeklyDays} selected{selectedDays.length === weeklyDays ? ' ✓' : ''}
      </p>
    </div>
  )
}

// ─── Step 4 — Day types ───────────────────────────────────────────────────────

function Step4({ sortedSelectedDays, dayTypes, setDayTypes, selectedProgram }) {
  const typeOptions = PROGRAM_DAY_TYPES[selectedProgram] ?? []

  return (
    <div style={sc.stepWrap}>
      <div style={sc.heading}>
        <h1 style={sc.h1}>What type is each day?</h1>
        <p style={sc.sub}>You can change this anytime.</p>
      </div>
      <div style={sc.dayTypeList}>
        {sortedSelectedDays.map(day => (
          <div key={day} style={sc.dayTypeRow}>
            <span style={sc.dayTypeName}>{DAY_NAME[day]}</span>
            <div style={sc.typeScrollWrap}>
              <div style={sc.typeScroll}>
                {typeOptions.map(opt => {
                  const active = dayTypes[day] === opt.id
                  return (
                    <button
                      key={opt.id}
                      style={{
                        ...sc.typePill,
                        background: active ? 'var(--color-accent)' : 'var(--color-chart-bar)',
                        color:      active ? '#fff' : 'var(--color-muted)',
                        border:     active ? 'none' : 'var(--border)',
                      }}
                      onClick={() => setDayTypes(prev => ({ ...prev, [day]: opt.id }))}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Step 5 — Equipment ───────────────────────────────────────────────────────

function Step5({ equipment, onSelect }) {
  return (
    <div style={sc.stepWrap}>
      <div style={sc.heading}>
        <h1 style={sc.h1}>What equipment do you have?</h1>
        <p style={sc.sub}>Controls what exercises get generated.</p>
      </div>
      <div style={sc.cardList}>
        {EQUIPMENT_OPTIONS.map(opt => {
          const active = equipment === opt.value
          return (
            <button
              key={opt.value}
              style={{
                ...sc.programCard,
                background: active ? 'var(--color-accent-bg)' : 'var(--color-card)',
                border:     active ? '1.5px solid var(--color-accent)' : 'var(--border)',
              }}
              onClick={() => onSelect(opt.value)}
            >
              <p style={sc.programTitle}>{opt.title}</p>
              <p style={sc.programDesc}>{opt.desc}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 6 — Program dates ───────────────────────────────────────────────────

function Step6({ startDate, goalDate, showGoalDate, onStartDateChange, onGoalDateChange, onToggleGoalDate }) {
  return (
    <div style={sc.stepWrap}>
      <div style={sc.heading}>
        <h1 style={sc.h1}>When do you start?</h1>
        <p style={sc.sub}>We'll track your progress from day one.</p>
      </div>

      <div style={sc.dateField}>
        <label style={sc.dateLabel}>Program start date</label>
        <input
          type="date"
          style={sc.dateInput}
          value={startDate}
          onChange={e => onStartDateChange(e.target.value)}
        />
      </div>

      <button style={sc.goalToggleBtn} onClick={() => onToggleGoalDate(!showGoalDate)}>
        <span style={{
          ...sc.toggleDot,
          background: showGoalDate ? 'var(--color-accent)' : 'var(--color-chart-bar)',
          border:     showGoalDate ? 'none' : 'var(--border)',
        }} />
        I have a specific goal date
      </button>

      {showGoalDate && (
        <div style={sc.dateField}>
          <label style={sc.dateLabel}>Goal date</label>
          <p style={sc.dateHint}>A race, event, or milestone.</p>
          <input
            type="date"
            style={sc.dateInput}
            value={goalDate}
            onChange={e => onGoalDateChange(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}

// ─── Step 7 — Audio + summary ─────────────────────────────────────────────────

function Step7({
  selectedProgram, weeklyDays, sortedSelectedDays, dayTypes,
  equipment, startDate, phaseLabel, weekNum, audioEnabled, onAudioToggle,
}) {
  const equipLabel  = EQUIPMENT_OPTIONS.find(e => e.value === equipment)?.title ?? equipment
  const startDisplay = startDate
    ? new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : '—'

  return (
    <div style={sc.stepWrap}>
      <h1 style={{ ...sc.h1, marginTop: 0 }}>Almost there.</h1>

      {/* Audio toggle row */}
      <div style={sc.audioRow}>
        <div style={sc.audioText}>
          <p style={sc.audioTitle}>Audio cues during workouts</p>
          <p style={sc.audioSub}>Spoken segment cues and timers.</p>
        </div>
        <button
          style={{
            ...sc.toggleTrack,
            background: audioEnabled ? 'var(--color-accent)' : 'var(--color-faint)',
          }}
          onClick={() => onAudioToggle(!audioEnabled)}
          aria-label="Toggle audio cues"
        >
          <span style={{
            ...sc.toggleThumb,
            left: audioEnabled ? '21px' : '3px',
          }} />
        </button>
      </div>

      {/* Summary card */}
      <div style={sc.summaryCard}>
        <SummaryRow label="Program"   value={PROGRAM_LABEL[selectedProgram] ?? '—'} />
        <div style={sc.summaryDivider} />
        <SummaryRow label="Training"  value={`${weeklyDays} days / week`} />
        <div style={sc.summaryDivider} />
        <SummaryRow label="Equipment" value={equipLabel} />
        <div style={sc.summaryDivider} />
        <SummaryRow label="Start date" value={startDisplay} />
        <div style={sc.summaryDivider} />
        <SummaryRow label="Phase"     value={`${phaseLabel} — Week ${weekNum}`} />
        <div style={sc.summaryDivider} />
        <p style={sc.summaryLabel}>Week preview</p>
        <div style={sc.weekPreview}>
          {sortedSelectedDays.map(day => (
            <span key={day} style={sc.previewChip}>
              {DAY_ABBR[day]} {TYPE_LABEL[dayTypes[day]] ?? '—'}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <>
      <p style={sc.summaryLabel}>{label}</p>
      <p style={sc.summaryValue}>{value}</p>
    </>
  )
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function FitnessSetup({ onComplete, onBack, isEditing = false }) {
  const { fitnessState, fitnessDispatch } = useFitness()
  const { settingsState, settingsDispatch } = useSettings()

  const existing    = fitnessState.programConfig
  const initialProg = fitnessState.program.type

  // Track initial program to know when the user changes it (clears day types).
  const initialProgramRef = useRef(initialProg)

  const [step, setStep]                   = useState(1)
  const [selectedProgram, setSelectedProgram] = useState(() => initialProg)
  const [weeklyDays, setWeeklyDays]       = useState(() => (existing.weeklyDays > 0 ? existing.weeklyDays : 4))
  const [selectedDays, setSelectedDays]   = useState(() => existing.trainingDays ?? [])
  const [dayTypes, setDayTypes]           = useState(() => existing.dayTypes ?? {})
  const [equipment, setEquipment]         = useState(() => settingsState.gymAccess || GYM_ACCESS.BODYWEIGHT)
  const [startDate, setStartDate]         = useState(() => fitnessState.programStartDate || getTodayISO())
  const [goalDate, setGoalDate]           = useState(() => fitnessState.programEndDate || '')
  const [showGoalDate, setShowGoalDate]   = useState(() => Boolean(fitnessState.programEndDate))
  const [audioEnabled, setAudioEnabled]   = useState(() => existing.audioEnabled ?? false)

  // Days sorted in canonical Mon–Sun order (used for display and CONFIGURE_PROGRAM payload).
  const sortedSelectedDays = [...selectedDays].sort(
    (a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b)
  )

  // Recommended split shown on step 2 (first N smart-default type labels for current weeklyDays).
  const recommendedSplit = selectedProgram
    ? (SMART_DEFAULTS[selectedProgram] ?? [])
        .slice(0, weeklyDays)
        .map(t => TYPE_LABEL[t] ?? t)
        .join(' / ')
    : ''

  const phaseKey = getPhase(startDate || null)
  const weekNum  = getWeekNumber(startDate || null)

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleDayToggle(day) {
    setSelectedDays(prev => {
      if (prev.includes(day)) return prev.filter(d => d !== day)
      if (prev.length < weeklyDays) return [...prev, day]
      // Rolling replacement: remove earliest-selected, add new.
      return [...prev.slice(1), day]
    })
  }

  function handleWeeklyDaysChange(n) {
    setWeeklyDays(n)
    // Trim selection if count drops below current selection length.
    if (selectedDays.length > n) {
      setSelectedDays(prev => prev.slice(0, n))
    }
  }

  function canAdvance() {
    if (step === 1) return Boolean(selectedProgram)
    if (step === 3) return selectedDays.length === weeklyDays
    if (step === 6) return Boolean(startDate)
    return true
  }

  function handleNext() {
    if (!canAdvance()) return

    if (step === 1) {
      if (selectedProgram !== initialProgramRef.current) {
        setDayTypes({})
        initialProgramRef.current = selectedProgram
      }
      setStep(2)
      return
    }

    if (step === 3) {
      // Apply smart defaults for each selected day; preserve any type already chosen.
      const defaults    = SMART_DEFAULTS[selectedProgram] ?? []
      const fallback    = PROGRAM_DAY_TYPES[selectedProgram]?.[0]?.id ?? 'upper'
      const sorted      = [...selectedDays].sort(
        (a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b)
      )
      const newDayTypes = {}
      sorted.forEach((day, i) => {
        newDayTypes[day] = dayTypes[day] || defaults[i] || fallback
      })
      setDayTypes(newDayTypes)
      setStep(4)
      return
    }

    setStep(s => s + 1)
  }

  function handleBack() {
    if (step === 1) {
      onBack?.()
    } else {
      setStep(s => s - 1)
    }
  }

  function handleEquipmentSelect(value) {
    setEquipment(value)
    settingsDispatch({ type: 'UPDATE_SETTING', payload: { key: 'gymAccess', value } })
  }

  function handleStartDateChange(value) {
    setStartDate(value)
    fitnessDispatch({ type: 'UPDATE_FITNESS', payload: { key: 'programStartDate', value: value || null } })
  }

  function handleGoalDateChange(value) {
    setGoalDate(value)
    fitnessDispatch({ type: 'UPDATE_FITNESS', payload: { key: 'programEndDate', value: value || null } })
  }

  function handleGoalDateToggle(show) {
    setShowGoalDate(show)
    if (!show) handleGoalDateChange('')
  }

  function handleComplete() {
    fitnessDispatch({
      type:    'CONFIGURE_PROGRAM',
      payload: {
        type:         selectedProgram,
        trainingDays: sortedSelectedDays,
        dayTypes,
        goal:         selectedProgram,
        audioEnabled,
      },
    })
    onComplete()
  }

  // Back arrow appears on steps 2–7 always, and on step 1 when isEditing.
  const showBack = step > 1 || isEditing

  return (
    <div style={s.overlay}>
      {/* Top bar: back arrow + progress dots */}
      <div style={s.topBar}>
        {showBack
          ? <button style={s.backBtn} onClick={handleBack}>←</button>
          : <div style={s.backPlaceholder} />
        }
        <div style={s.dotsRow}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              style={{
                ...s.dot,
                background: i < step ? 'var(--color-accent)' : 'var(--color-border)',
              }}
            />
          ))}
        </div>
        <div style={s.backPlaceholder} />
      </div>

      {/* Step content (scrollable) */}
      <div style={s.scroll}>
        {step === 1 && (
          <Step1 selectedProgram={selectedProgram} onSelect={setSelectedProgram} />
        )}
        {step === 2 && (
          <Step2
            weeklyDays={weeklyDays}
            onSelect={handleWeeklyDaysChange}
            recommendedSplit={recommendedSplit}
          />
        )}
        {step === 3 && (
          <Step3
            selectedDays={selectedDays}
            weeklyDays={weeklyDays}
            onToggle={handleDayToggle}
          />
        )}
        {step === 4 && (
          <Step4
            sortedSelectedDays={sortedSelectedDays}
            dayTypes={dayTypes}
            setDayTypes={setDayTypes}
            selectedProgram={selectedProgram}
          />
        )}
        {step === 5 && (
          <Step5 equipment={equipment} onSelect={handleEquipmentSelect} />
        )}
        {step === 6 && (
          <Step6
            startDate={startDate}
            goalDate={goalDate}
            showGoalDate={showGoalDate}
            onStartDateChange={handleStartDateChange}
            onGoalDateChange={handleGoalDateChange}
            onToggleGoalDate={handleGoalDateToggle}
          />
        )}
        {step === 7 && (
          <Step7
            selectedProgram={selectedProgram}
            weeklyDays={weeklyDays}
            sortedSelectedDays={sortedSelectedDays}
            dayTypes={dayTypes}
            equipment={equipment}
            startDate={startDate}
            phaseLabel={PHASE_LABELS[phaseKey]}
            weekNum={weekNum}
            audioEnabled={audioEnabled}
            onAudioToggle={setAudioEnabled}
          />
        )}
      </div>

      {/* CTA footer */}
      <div style={s.footer}>
        <button
          style={{
            ...s.cta,
            opacity:       canAdvance() ? 1 : 0.35,
            pointerEvents: canAdvance() ? 'auto' : 'none',
          }}
          onClick={step < TOTAL_STEPS ? handleNext : handleComplete}
        >
          {step < TOTAL_STEPS ? 'Next →' : 'Start my program →'}
        </button>
      </div>
    </div>
  )
}

// ─── Overlay styles ───────────────────────────────────────────────────────────

const s = {
  overlay: {
    position:      'fixed',
    inset:         0,
    background:    'var(--color-bg)',
    zIndex:        300,
    display:       'flex',
    flexDirection: 'column',
    width:         '100%',
    maxWidth:      '100%',
    height:        '100%',
    overflow:      'hidden',
  },
  topBar: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        'calc(var(--safe-top) + 16px) 20px 12px',
    flexShrink:     0,
  },
  backBtn: {
    background:  'none',
    border:      'none',
    color:       'var(--color-text)',
    fontSize:    '22px',
    cursor:      'pointer',
    padding:     '4px 8px 4px 0',
    lineHeight:  1,
  },
  backPlaceholder: { width: '40px' },
  dotsRow: {
    display:    'flex',
    gap:        '4px',
    alignItems: 'center',
  },
  dot: {
    width:        '6px',
    height:       '6px',
    borderRadius: '50%',
    transition:   'background 0.2s',
  },
  scroll: {
    flex:      1,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  footer: {
    position:      'fixed',
    bottom:        0,
    left:          0,
    width:         '100%',
    background:    'var(--color-bg)',
    padding:       '12px 20px',
    paddingBottom: 'calc(var(--safe-bottom) + 16px)',
    zIndex:        10,
  },
  cta: {
    width:        '100%',
    padding:      '16px',
    borderRadius: 'var(--radius-card)',
    background:   'var(--color-accent)',
    color:        '#fff',
    fontSize:     '16px',
    fontWeight:   600,
    border:       'none',
    cursor:       'pointer',
    transition:   'opacity 0.15s',
  },
}

// ─── Step content styles ──────────────────────────────────────────────────────

const sc = {
  stepWrap: {
    padding:       '4px 20px 120px',
    display:       'flex',
    flexDirection: 'column',
    gap:           '12px',
  },

  // Heading block (sub + h1 grouped tight)
  heading: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '4px',
  },
  sub: {
    fontSize: '13px',
    color:    'var(--color-muted)',
  },
  h1: {
    fontFamily: 'var(--font-display)',
    fontSize:   '24px',
    color:      'var(--color-text)',
    lineHeight: 1.15,
  },

  // Program / equipment option cards (steps 1 & 5)
  cardList: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '6px',
  },
  programCard: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '2px',
    padding:       '10px 12px',
    borderRadius:  'var(--radius-card)',
    textAlign:     'left',
    cursor:        'pointer',
    transition:    'border-color 0.15s, background 0.15s',
  },
  programTitle: {
    fontSize:   '13px',
    fontWeight: 600,
    color:      'var(--color-text)',
  },
  programDesc: {
    fontSize:   '11px',
    color:      'var(--color-muted)',
    lineHeight: 1.3,
  },
  tagRow: {
    display:    'flex',
    gap:        '4px',
    flexWrap:   'wrap',
    marginTop:  '4px',
  },
  tag: {
    padding:      '2px 6px',
    borderRadius: 'var(--radius-pill)',
    fontSize:     '9px',
    fontWeight:   600,
  },

  // Count pills (step 2)
  pillRow: {
    display: 'flex',
    gap:     '8px',
  },
  countPill: {
    flex:         1,
    padding:      '14px 0',
    borderRadius: 'var(--radius-sm)',
    fontSize:     '17px',
    fontWeight:   600,
    cursor:       'pointer',
    transition:   'background 0.15s',
  },

  // Recommended split hint (step 2)
  splitHint: {
    background:   'var(--color-card)',
    border:       'var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding:      '12px 14px',
  },
  splitLabel: {
    fontSize:      '10px',
    fontWeight:    600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color:         'var(--color-muted)',
    marginBottom:  '4px',
  },
  splitValue: {
    fontSize:   '14px',
    color:      'var(--color-text)',
    fontWeight: 500,
  },

  // Day selection pills (step 3)
  dayPillRow: {
    display: 'flex',
    gap:     '5px',
  },
  dayPill: {
    flex:         1,
    padding:      '12px 0',
    borderRadius: 'var(--radius-sm)',
    fontSize:     '11px',
    fontWeight:   600,
    cursor:       'pointer',
    transition:   'background 0.15s',
  },
  helpText: {
    fontSize:  '12px',
    color:     'var(--color-muted)',
    textAlign: 'center',
  },

  // Day type assignment (step 4)
  dayTypeList: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '18px',
  },
  dayTypeRow: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '8px',
  },
  dayTypeName: {
    fontSize:   '14px',
    fontWeight: 600,
    color:      'var(--color-text)',
  },
  typeScrollWrap: {
    overflowX:              'auto',
    WebkitOverflowScrolling:'touch',
    scrollbarWidth:         'none',
    msOverflowStyle:        'none',
    width:                  '100%',
  },
  typeScroll: {
    display:       'flex',
    gap:           '6px',
    paddingBottom: '4px',
  },
  typePill: {
    flexShrink:   0,
    minWidth:     'auto',
    padding:      '9px 16px',
    borderRadius: 'var(--radius-pill)',
    fontSize:     '13px',
    fontWeight:   600,
    cursor:       'pointer',
    whiteSpace:   'nowrap',
    transition:   'background 0.15s',
  },

  // Date inputs (step 6)
  dateField: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '6px',
  },
  dateLabel: {
    fontSize:   '14px',
    color:      'var(--color-text)',
    fontWeight: 600,
  },
  dateHint: {
    fontSize: '11px',
    color:    'var(--color-muted)',
    marginTop: '-2px',
  },
  dateInput: {
    height:      '44px',
    background:  'var(--color-card)',
    border:      'var(--border)',
    borderRadius:'var(--radius-sm)',
    color:       'var(--color-text)',
    fontFamily:  'var(--font-body)',
    fontSize:    '15px',
    padding:     '0 12px',
    outline:     'none',
    width:       '100%',
    colorScheme: 'dark',
  },

  // Goal date toggle button (step 6)
  goalToggleBtn: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
    background: 'none',
    border:     'none',
    padding:    '4px 0',
    cursor:     'pointer',
    fontSize:   '14px',
    color:      'var(--color-text)',
    fontWeight: 500,
  },
  toggleDot: {
    width:        '22px',
    height:       '22px',
    borderRadius: '50%',
    flexShrink:   0,
    transition:   'background 0.2s',
  },

  // Audio toggle row (step 7)
  audioRow: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            '12px',
    padding:        '14px',
    background:     'var(--color-card)',
    border:         'var(--border)',
    borderRadius:   'var(--radius-sm)',
  },
  audioText: {
    flex:          1,
    display:       'flex',
    flexDirection: 'column',
    gap:           '2px',
  },
  audioTitle: {
    fontSize:   '14px',
    fontWeight: 600,
    color:      'var(--color-text)',
  },
  audioSub: {
    fontSize: '11px',
    color:    'var(--color-muted)',
  },
  toggleTrack: {
    width:        '44px',
    height:       '26px',
    borderRadius: 'var(--radius-pill)',
    border:       'none',
    cursor:       'pointer',
    position:     'relative',
    flexShrink:   0,
    transition:   'background 0.2s',
  },
  toggleThumb: {
    position:     'absolute',
    top:          '3px',
    width:        '20px',
    height:       '20px',
    borderRadius: '50%',
    background:   '#fff',
    transition:   'left 0.2s',
  },

  // Summary card (step 7)
  summaryCard: {
    background:    'var(--color-card)',
    border:        'var(--border)',
    borderRadius:  'var(--radius-card)',
    padding:       '16px',
    display:       'flex',
    flexDirection: 'column',
    gap:           '6px',
  },
  summaryLabel: {
    fontSize:      '10px',
    fontWeight:    600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color:         'var(--color-muted)',
  },
  summaryValue: {
    fontSize:   '15px',
    color:      'var(--color-text)',
    fontWeight: 500,
    marginTop:  '-2px',
  },
  summaryDivider: {
    height:     '0.5px',
    background: 'var(--color-border)',
    margin:     '4px 0',
  },
  weekPreview: {
    display:   'flex',
    flexWrap:  'wrap',
    gap:       '6px',
    marginTop: '2px',
  },
  previewChip: {
    padding:      '3px 9px',
    borderRadius: 'var(--radius-pill)',
    background:   'var(--color-accent-bg)',
    color:        'var(--color-accent)',
    border:       '0.5px solid var(--color-accent)',
    fontSize:     '11px',
    fontWeight:   600,
  },
}
