import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  formatSegmentPrescription,
  getEquipmentNeededForSegment,
  getSideInstruction,
} from '../utils/workoutDisplay.js'
import {
  getPhaseProgress,
  normalizeWorkoutForPlayback,
} from '../utils/workoutPlayback.js'

const FEEL_OPTIONS = [
  { value: 1, emoji: '😴' },
  { value: 2, emoji: '😐' },
  { value: 3, emoji: '🙂' },
  { value: 4, emoji: '😄' },
  { value: 5, emoji: '⚡' },
]

const playbackSessions = new Map()

function fmtMMSS(totalSec) {
  const safe = Math.max(0, Math.round(totalSec || 0))
  const m = Math.floor(safe / 60)
  const sec = safe % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function getWorkoutType(workout) {
  return workout.dayType ?? workout.type
}

function readNumber(value, fallback = 0) {
  if (value === '' || value === null || value === undefined) return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function getSessionKey(workout) {
  return workout.id ?? `${workout.date ?? 'today'}_${getWorkoutType(workout) ?? 'workout'}`
}

function makeSetRows(step, savedRows) {
  if (savedRows) return savedRows
  return Array.from({ length: step.sets ?? 1 }, (_, index) => ({
    exercise: step.name,
    exerciseId: step.exerciseId,
    setNumber: index + 1,
    plannedReps: step.reps,
    reps: String(step.reps ?? ''),
    weight: '',
    rpe: step.rpeTarget ?? '',
    note: '',
    done: false,
  }))
}

function buildExerciseSummary(steps, journal) {
  return steps
    .filter(step => step.type === 'sets_reps')
    .map(step => {
      const rows = journal[step.id] ?? []
      return {
        name: rows[0]?.exercise ?? step.name,
        exerciseId: rows[0]?.exerciseId ?? step.exerciseId,
        sets: step.sets,
        reps: step.reps,
        completed: rows.filter(row => row.done).length,
        plannedReps: step.reps,
      }
    })
}

function buildSetLog(journal) {
  return Object.values(journal)
    .flat()
    .filter(row => row.done)
    .map(row => ({
      exercise: row.exercise,
      exerciseId: row.exerciseId,
      setNumber: row.setNumber,
      plannedReps: readNumber(row.plannedReps),
      reps: readNumber(row.reps, readNumber(row.plannedReps)),
      weight: readNumber(row.weight, 0),
      rpe: readNumber(row.rpe, 0),
      note: row.note?.trim() ?? '',
    }))
}

function getStepTimer(savedTimers, step) {
  const saved = savedTimers[step.id]
  if (saved) return saved
  const duration = Number(step.duration) || 0
  return { remaining: duration, elapsed: 0, complete: duration === 0 }
}

function getInitialSubstitutionId(step, savedRows) {
  const savedId = savedRows?.[0]?.exerciseId
  if (!savedId || savedId === step.exerciseId) return null
  return step.substitutions?.some(option => option.exerciseId === savedId) ? savedId : null
}

function getActiveStep(step, substitutionId) {
  const substitution = step.substitutions?.find(option => option.exerciseId === substitutionId)
  if (!substitution) return step
  return {
    ...step,
    name: substitution.name,
    exerciseId: substitution.exerciseId,
    equipment: substitution.equipment,
    equipmentNeeded: substitution.equipmentNeeded,
    cues: substitution.cues,
    media: substitution.media,
  }
}

export default function WorkoutPlayer({ workout, onComplete, onClose }) {
  const steps = useMemo(() => normalizeWorkoutForPlayback(workout), [workout])
  const sessionKey = getSessionKey(workout)
  const saved = playbackSessions.get(sessionKey)

  const [stepIndex, setStepIndex] = useState(() => saved?.stepIndex ?? 0)
  const [showPost, setShowPost] = useState(() => saved?.showPost ?? (getWorkoutType(workout) === 'rest' || steps.length === 0))
  const [journal, setJournal] = useState(() => saved?.journal ?? {})
  const [timers, setTimers] = useState(() => saved?.timers ?? {})
  const [paused, setPaused] = useState(() => saved?.paused ?? false)
  const [autoplay, setAutoplay] = useState(() => saved?.autoplay ?? true)

  const step = steps[stepIndex]
  const timer = step ? getStepTimer(timers, step) : null
  const phaseProgress = getPhaseProgress(steps, stepIndex)
  const isFirst = stepIndex <= 0
  const isLast = stepIndex >= steps.length - 1

  useEffect(() => {
    playbackSessions.set(sessionKey, { stepIndex, showPost, journal, timers, paused, autoplay })
  }, [sessionKey, stepIndex, showPost, journal, timers, paused, autoplay])

  useEffect(() => {
    if (!step || showPost) return undefined
    if (step.type !== 'timed' && step.type !== 'rest') return undefined
    if (paused || timer?.complete) return undefined

    const id = setInterval(() => {
      setTimers(current => {
        const currentTimer = getStepTimer(current, step)
        if (currentTimer.complete) return current
        const remaining = Math.max(0, currentTimer.remaining - 1)
        return {
          ...current,
          [step.id]: {
            remaining,
            elapsed: currentTimer.elapsed + 1,
            complete: remaining === 0,
          },
        }
      })
    }, 1000)

    return () => clearInterval(id)
  }, [step, timer?.complete, paused, showPost])

  useEffect(() => {
    if (!step || showPost) return
    if (step.type !== 'timed' && step.type !== 'rest') return
    if (!timer?.complete || !autoplay || paused) return
    const id = setTimeout(() => goNext(), 650)
    return () => clearTimeout(id)
    // goNext intentionally reads current stepIndex.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id, timer?.complete, autoplay, paused, showPost])

  function goPrevious() {
    setShowPost(false)
    setStepIndex(index => Math.max(0, index - 1))
  }

  function goNext() {
    if (isLast) {
      setShowPost(true)
      return
    }
    setStepIndex(index => Math.min(steps.length - 1, index + 1))
  }

  const handleExerciseRowsChange = useCallback((stepId, rows) => {
    setJournal(current => ({ ...current, [stepId]: rows }))
  }, [])

  function handleSave({ feel, rpe, notes }) {
    const startedAt = workout.startedAt ?? Date.now()
    const durationMin = Math.max(1, Math.round((Date.now() - startedAt) / 60000))
    playbackSessions.delete(sessionKey)
    onComplete({
      date: new Date().toISOString(),
      type: getWorkoutType(workout),
      title: workout.title,
      duration: durationMin,
      feel,
      rpe,
      notes,
      exercises: buildExerciseSummary(steps, journal),
      sets: buildSetLog(journal),
    })
  }

  if (showPost) {
    return (
      <div style={s.screen}>
        <PostWorkoutLog
          startedAt={workout.startedAt}
          onSave={handleSave}
          onCancel={onClose}
          onPrevious={steps.length ? () => setShowPost(false) : null}
        />
      </div>
    )
  }

  return (
    <div style={s.screen}>
      <header style={s.header}>
        <button style={s.exitBtn} onClick={onClose}>Exit</button>
        <div style={s.phaseLabel}>
          {phaseProgress.label} {phaseProgress.current} of {phaseProgress.total}
        </div>
        <button
          style={{ ...s.autoBtn, color: autoplay ? 'var(--color-accent)' : 'var(--color-muted)' }}
          onClick={() => setAutoplay(value => !value)}
        >
          Autoplay {autoplay ? 'On' : 'Off'}
        </button>
      </header>

      <NextUp step={steps[stepIndex + 1]} />

      <main style={s.body}>
        <MediaPlaceholder step={step} />
        {step?.type === 'timed' && (
          <TimedStep step={step} timer={timer} paused={paused} />
        )}
        {step?.type === 'rest' && (
          <RestStep step={step} timer={timer} paused={paused} />
        )}
        {step?.type === 'sets_reps' && (
          <ExerciseStep
            key={step.id}
            step={step}
            savedRows={journal[step.id]}
            onRowsChange={handleExerciseRowsChange}
          />
        )}
        {step?.type === 'text' && (
          <TextStep step={step} />
        )}
      </main>

      <div style={s.dots} aria-hidden="true">
        {steps.map((item, index) => (
          <span
            key={item.id}
            style={{
              ...s.dot,
              background: index < stepIndex
                ? 'var(--color-success)'
                : index === stepIndex
                  ? 'var(--color-accent)'
                  : 'var(--color-faint)',
            }}
          />
        ))}
      </div>

      <footer style={s.controls}>
        <button style={{ ...s.secondaryBtn, opacity: isFirst ? 0.35 : 1 }} disabled={isFirst} onClick={goPrevious}>
          Previous
        </button>
        <button style={s.pauseBtn} onClick={() => setPaused(value => !value)}>
          {paused ? 'Resume Workout' : 'Pause'}
        </button>
        <button style={s.primaryBtn} onClick={goNext}>
          {isLast ? 'Finish' : 'Next'}
        </button>
      </footer>
    </div>
  )
}

function NextUp({ step }) {
  if (!step) {
    return (
      <div style={s.nextUp}>
        <span style={s.nextLabel}>finish</span>
        <span style={s.nextName}>post-workout log</span>
      </div>
    )
  }

  const detail = step.type === 'rest' ? fmtMMSS(step.duration) : formatSegmentPrescription(step)
  const equipment = getEquipmentNeededForSegment(step)
  return (
    <div style={s.nextUp}>
      <span style={s.nextLabel}>next up</span>
      <span style={s.nextName}>{step.name}</span>
      {detail && <span style={s.nextDetail}>{detail}</span>}
      {equipment.length > 0 && (
        <span style={s.nextEquipment}>equipment · {equipment.join(' · ')}</span>
      )}
    </div>
  )
}

function MediaPlaceholder({ step }) {
  const kindLabel = step?.media?.kind === 'placeholder' ? 'video / gif placeholder' : step?.media?.kind
  return (
    <div style={s.media}>
      <span style={s.mediaKind}>{kindLabel ?? 'video / gif placeholder'}</span>
      <span style={s.mediaAlt}>{step?.media?.alt ?? 'movement preview placeholder'}</span>
    </div>
  )
}

function TimedStep({ step, timer, paused }) {
  return (
    <section style={s.centerStep}>
      <p style={s.stepKind}>{step.sideLabel ?? 'timed'}</p>
      <h2 style={s.stepName}>{step.name}</h2>
      <p style={s.timer}>{fmtMMSS(timer?.remaining)}</p>
      {paused && <p style={s.paused}>paused</p>}
      {step.instruction && <p style={s.stepDetail}>{step.instruction}</p>}
      {step.effort && <p style={s.effort}>{step.effort}</p>}
    </section>
  )
}

function RestStep({ step, timer, paused }) {
  return (
    <section style={s.centerStep}>
      <p style={s.stepKind}>rest</p>
      <h2 style={s.stepName}>{step.name}</h2>
      <p style={s.timer}>{fmtMMSS(timer?.remaining)}</p>
      {paused && <p style={s.paused}>paused</p>}
      {step.instruction && <p style={s.nextInstruction}>{step.instruction}</p>}
      <p style={s.stepDetail}>Breathe, reset, and get ready for what is next.</p>
    </section>
  )
}

function TextStep({ step }) {
  return (
    <section style={s.textStep}>
      <h2 style={s.stepName}>{step.name}</h2>
      {step.instruction && <p style={s.stepDetail}>{step.instruction}</p>}
    </section>
  )
}

function ExerciseStep({ step, savedRows, onRowsChange }) {
  const [substitutionId, setSubstitutionId] = useState(() => getInitialSubstitutionId(step, savedRows))
  const activeStep = getActiveStep(step, substitutionId)
  const [rows, setRows] = useState(() => makeSetRows(step, savedRows))
  const sideInstruction = getSideInstruction(activeStep)
  const equipment = getEquipmentNeededForSegment(activeStep)
  const cues = (activeStep.cues ?? []).slice(0, 3)

  useEffect(() => {
    onRowsChange(step.id, rows)
  }, [rows, step.id, onRowsChange])

  function updateSet(index, patch) {
    setRows(current => current.map((row, i) => i === index ? { ...row, ...patch } : row))
  }

  function toggleSet(index) {
    setRows(current => current.map((row, i) => i === index ? { ...row, done: !row.done } : row))
  }

  function chooseSubstitution(option) {
    setSubstitutionId(option.exerciseId)
    setRows(current => current.map(row => ({
      ...row,
      exercise: option.name,
      exerciseId: option.exerciseId,
      done: false,
    })))
  }

  function chooseOriginal() {
    setSubstitutionId(null)
    setRows(current => current.map(row => ({
      ...row,
      exercise: step.name,
      exerciseId: step.exerciseId,
      done: false,
    })))
  }

  return (
    <section style={s.exercise}>
      <p style={s.stepKind}>action</p>
      <h2 style={s.exerciseName}>{activeStep.name}</h2>
      <p style={s.prescription}>{formatSegmentPrescription(activeStep)}</p>
      {sideInstruction && <p style={s.sideHint}>{sideInstruction}</p>}
      {equipment.length > 0 && <p style={s.equipment}>equipment · {equipment.join(' · ')}</p>}
      {activeStep.loadSuggestion?.suggestion && <p style={s.loadHint}>{activeStep.loadSuggestion.suggestion}</p>}
      {cues.length > 0 && (
        <div style={s.cueList}>
          <p style={s.cueLabel}>coach cues</p>
          {cues.map(cue => <p key={cue} style={s.cueItem}>• {cue}</p>)}
        </div>
      )}
      {(step.substitutions?.length ?? 0) > 0 && (
        <div style={s.swapList}>
          <p style={s.cueLabel}>equipment-ready swaps</p>
          <div style={s.swapButtons}>
            {substitutionId && (
              <button style={s.swapBtn} onClick={chooseOriginal} type="button">
                original
              </button>
            )}
            {step.substitutions.map(option => (
              <button
                key={option.exerciseId}
                style={{
                  ...s.swapBtn,
                  ...(substitutionId === option.exerciseId ? s.swapBtnActive : {}),
                }}
                onClick={() => chooseSubstitution(option)}
                type="button"
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={s.setList}>
        {rows.map((row, index) => (
          <div
            key={index}
            style={{
              ...s.setRow,
              background: row.done ? 'var(--color-success-bg)' : 'var(--color-card)',
              borderColor: row.done ? 'var(--color-success)' : 'var(--color-border)',
            }}
            onClick={() => toggleSet(index)}
          >
            <div style={s.setTop}>
              <span style={s.setName}>Set {index + 1}</span>
              <span style={s.setPlanned}>planned {row.plannedReps}{sideInstruction ? ` ${sideInstruction}` : ''}</span>
              <span style={{ ...s.setDone, color: row.done ? 'var(--color-success)' : 'var(--color-muted)' }}>
                {row.done ? 'done' : 'open'}
              </span>
            </div>
            <div style={s.setInputs}>
              <label style={s.setField} onClick={event => event.stopPropagation()}>
                <span style={s.setLabel}>actual</span>
                <input
                  style={s.setInput}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={row.reps}
                  onChange={event => updateSet(index, { reps: event.target.value })}
                />
              </label>
              <label style={s.setField} onClick={event => event.stopPropagation()}>
                <span style={s.setLabel}>weight</span>
                <input
                  style={s.setInput}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.5"
                  value={row.weight}
                  placeholder="0"
                  onChange={event => updateSet(index, { weight: event.target.value })}
                />
              </label>
            </div>
            <input
              style={s.noteInput}
              value={row.note}
              placeholder="note"
              onClick={event => event.stopPropagation()}
              onChange={event => updateSet(index, { note: event.target.value })}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

function PostWorkoutLog({ startedAt, onSave, onCancel, onPrevious }) {
  const [feel, setFeel] = useState(3)
  const [rpe, setRpe] = useState(6)
  const [notes, setNotes] = useState('')
  const [elapsedSec, setElapsedSec] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setElapsedSec(Math.round((Date.now() - (startedAt ?? Date.now())) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  const durationMin = Math.max(1, Math.round(elapsedSec / 60))

  return (
    <div style={post.wrap}>
      <p style={post.kicker}>workout log</p>
      <h2 style={post.title}>Workout done</h2>
      <p style={post.dur}>{durationMin} min · {fmtMMSS(elapsedSec)}</p>

      <div style={post.field}>
        <label style={post.label}>How did it feel?</label>
        <div style={post.feelRow}>
          {FEEL_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFeel(opt.value)}
              style={{
                ...post.feelBtn,
                background: feel === opt.value ? 'var(--color-accent-bg)' : 'var(--color-card)',
                borderColor: feel === opt.value ? 'var(--color-accent)' : 'var(--color-border)',
              }}
            >
              {opt.emoji}
            </button>
          ))}
        </div>
      </div>

      <div style={post.field}>
        <label style={post.label}>Workout RPE</label>
        <div style={post.rpeRow}>
          {Array.from({ length: 10 }, (_, index) => index + 1).map(value => (
            <button
              key={value}
              onClick={() => setRpe(value)}
              style={{
                ...post.rpeBtn,
                background: rpe === value ? 'var(--color-accent-bg)' : 'transparent',
                borderColor: rpe === value ? 'var(--color-accent)' : 'var(--color-border)',
                color: rpe === value ? 'var(--color-accent)' : 'var(--color-muted)',
              }}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div style={post.field}>
        <label style={post.label}>Notes</label>
        <textarea
          style={post.notes}
          value={notes}
          onChange={event => setNotes(event.target.value)}
          placeholder="How was it? Anything to remember?"
          rows={3}
        />
      </div>

      <button style={post.saveBtn} onClick={() => onSave({ feel, rpe, notes: notes.trim() })}>
        Save workout
      </button>
      {onPrevious && <button style={post.secondaryBtn} onClick={onPrevious}>Previous</button>}
      <button style={post.cancelBtn} onClick={onCancel}>Exit without saving</button>
    </div>
  )
}

const s = {
  screen: {
    position: 'fixed',
    inset: 0,
    background: 'var(--color-bg)',
    zIndex: 150,
    display: 'flex',
    flexDirection: 'column',
    paddingTop: 'calc(var(--safe-top) + 12px)',
    paddingBottom: 'calc(var(--safe-bottom) + 16px)',
    paddingLeft: '20px',
    paddingRight: '20px',
    maxWidth: 'var(--max-width)',
    margin: '0 auto',
  },
  header: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  exitBtn: {
    justifySelf: 'start',
    background: 'none',
    border: 'none',
    color: 'var(--color-muted)',
    fontSize: '13px',
    fontWeight: 650,
    padding: 0,
  },
  autoBtn: {
    justifySelf: 'end',
    background: 'none',
    border: 'none',
    fontSize: '11px',
    fontWeight: 700,
    padding: 0,
  },
  phaseLabel: {
    color: 'var(--color-muted)',
    fontSize: '11px',
    fontWeight: 750,
    letterSpacing: '0.08em',
  },
  nextUp: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr) auto',
    alignItems: 'baseline',
    gap: '4px 8px',
    padding: '10px 0 12px',
    borderTop: '0.5px solid color-mix(in srgb, var(--color-border) 48%, transparent)',
    borderBottom: '0.5px solid color-mix(in srgb, var(--color-border) 48%, transparent)',
    marginBottom: '12px',
  },
  nextLabel: {
    color: 'var(--color-muted)',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  nextName: {
    minWidth: 0,
    color: 'var(--color-text)',
    fontSize: '13px',
    fontWeight: 650,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  nextDetail: {
    color: 'var(--color-accent)',
    fontSize: '12px',
    fontWeight: 650,
  },
  nextEquipment: {
    gridColumn: '1 / 4',
    color: 'var(--color-muted)',
    fontSize: '11px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    overflowY: 'auto',
    paddingTop: '4px',
  },
  media: {
    minHeight: '118px',
    border: '0.5px dashed color-mix(in srgb, var(--color-border) 72%, transparent)',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    background: 'color-mix(in srgb, var(--color-card) 62%, transparent)',
  },
  mediaKind: {
    color: 'var(--color-accent)',
    fontSize: '10px',
    fontWeight: 750,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  mediaAlt: {
    color: 'var(--color-muted)',
    fontSize: '12px',
    textAlign: 'center',
    maxWidth: 250,
  },
  centerStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '8px',
    paddingTop: '10px',
  },
  stepKind: {
    color: 'var(--color-muted)',
    fontSize: '10px',
    fontWeight: 750,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  stepName: {
    fontFamily: 'var(--font-display)',
    color: 'var(--color-text)',
    fontSize: '24px',
    fontWeight: 600,
  },
  timer: {
    fontFamily: 'var(--font-display)',
    fontSize: '72px',
    color: 'var(--color-text)',
    lineHeight: 1,
    letterSpacing: 0,
  },
  paused: {
    color: 'var(--color-accent)',
    fontSize: '12px',
    fontWeight: 700,
  },
  stepDetail: {
    color: 'var(--color-text)',
    fontSize: '14px',
    lineHeight: 1.45,
    maxWidth: 300,
  },
  nextInstruction: {
    color: 'var(--color-accent)',
    fontSize: '13px',
    fontWeight: 700,
    lineHeight: 1.35,
  },
  effort: {
    color: 'var(--color-accent)',
    fontSize: '12px',
    fontWeight: 650,
  },
  textStep: {
    background: 'var(--color-card)',
    border: 'var(--border)',
    borderRadius: 'var(--radius-card)',
    padding: '22px 18px',
    textAlign: 'center',
  },
  exercise: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '8px',
  },
  exerciseName: {
    fontFamily: 'var(--font-display)',
    fontSize: '22px',
    color: 'var(--color-text)',
    textAlign: 'center',
  },
  prescription: {
    fontSize: '18px',
    color: 'var(--color-accent)',
    fontWeight: 650,
    textAlign: 'center',
  },
  sideHint: {
    fontSize: '12px',
    color: 'var(--color-muted)',
    fontWeight: 650,
    textAlign: 'center',
  },
  equipment: {
    fontSize: '11px',
    color: 'var(--color-muted)',
    textAlign: 'center',
  },
  loadHint: {
    fontSize: '12px',
    color: 'var(--color-muted)',
    textAlign: 'center',
    lineHeight: 1.35,
  },
  cueList: {
    borderTop: '0.5px solid color-mix(in srgb, var(--color-border) 58%, transparent)',
    borderBottom: '0.5px solid color-mix(in srgb, var(--color-border) 58%, transparent)',
    padding: '9px 0',
    marginTop: '4px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  cueLabel: {
    color: 'var(--color-muted)',
    fontSize: '10px',
    fontWeight: 750,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  cueItem: {
    color: 'var(--color-text)',
    fontSize: '12px',
    lineHeight: 1.35,
  },
  swapList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: '2px',
  },
  swapButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  swapBtn: {
    border: '0.5px solid var(--color-border)',
    borderRadius: 'var(--radius-pill)',
    background: 'var(--color-card)',
    color: 'var(--color-muted)',
    fontSize: '11px',
    fontWeight: 650,
    padding: '7px 10px',
  },
  swapBtnActive: {
    borderColor: 'var(--color-accent)',
    background: 'var(--color-accent-bg)',
    color: 'var(--color-accent)',
  },
  setList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '8px',
  },
  setRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    border: '0.5px solid',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  },
  setTop: {
    display: 'grid',
    gridTemplateColumns: '1fr auto auto',
    gap: '8px',
    alignItems: 'center',
  },
  setName: { fontSize: '13px', fontWeight: 650, color: 'var(--color-text)' },
  setPlanned: { fontSize: '11px', color: 'var(--color-muted)' },
  setDone: { fontSize: '11px', fontWeight: 650 },
  setInputs: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  setField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  setLabel: {
    fontSize: '10px',
    color: 'var(--color-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: 650,
  },
  setInput: {
    width: '100%',
    border: '0.5px solid var(--color-border)',
    borderRadius: '8px',
    padding: '8px',
    font: 'inherit',
    color: 'var(--color-text)',
    background: 'var(--color-bg)',
  },
  noteInput: {
    width: '100%',
    border: 'none',
    borderBottom: '0.5px solid var(--color-border)',
    padding: '6px 0',
    font: 'inherit',
    fontSize: '12px',
    color: 'var(--color-text)',
    background: 'transparent',
  },
  dots: {
    display: 'flex',
    justifyContent: 'center',
    gap: '4px',
    flexWrap: 'wrap',
    padding: '10px 0',
  },
  dot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
  },
  controls: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.15fr 1fr',
    gap: '8px',
    paddingTop: '8px',
  },
  primaryBtn: {
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-accent)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 750,
    padding: '13px 10px',
  },
  pauseBtn: {
    border: '0.5px solid var(--color-accent)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-accent-bg)',
    color: 'var(--color-accent)',
    fontSize: '13px',
    fontWeight: 750,
    padding: '13px 8px',
  },
  secondaryBtn: {
    border: '0.5px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-card)',
    color: 'var(--color-muted)',
    fontSize: '13px',
    fontWeight: 700,
    padding: '13px 8px',
  },
}

const post = {
  wrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '18px',
    padding: '20px 0',
  },
  kicker: {
    color: 'var(--color-muted)',
    fontSize: '11px',
    fontWeight: 750,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  title: {
    fontFamily: 'var(--font-display)',
    color: 'var(--color-text)',
    fontSize: '30px',
    textAlign: 'center',
  },
  dur: {
    color: 'var(--color-muted)',
    fontSize: '13px',
    textAlign: 'center',
    marginTop: '-10px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    color: 'var(--color-muted)',
    fontSize: '12px',
    fontWeight: 650,
  },
  feelRow: { display: 'flex', gap: '8px' },
  feelBtn: {
    flex: 1,
    height: '44px',
    border: '0.5px solid',
    borderRadius: 'var(--radius-sm)',
    fontSize: '20px',
  },
  rpeRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '6px',
  },
  rpeBtn: {
    height: '34px',
    border: '0.5px solid',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
  },
  notes: {
    width: '100%',
    resize: 'vertical',
    border: 'var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px',
    font: 'inherit',
    color: 'var(--color-text)',
    background: 'var(--color-card)',
  },
  saveBtn: {
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-accent)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 750,
    padding: '14px',
  },
  secondaryBtn: {
    border: '0.5px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-card)',
    color: 'var(--color-muted)',
    fontSize: '14px',
    fontWeight: 700,
    padding: '12px',
  },
  cancelBtn: {
    border: 'none',
    background: 'none',
    color: 'var(--color-muted)',
    fontSize: '13px',
    fontWeight: 650,
    padding: '4px',
  },
}
