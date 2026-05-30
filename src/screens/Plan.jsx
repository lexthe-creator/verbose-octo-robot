import { useState } from 'react'
import { usePlanning } from '../context/index.js'
import { getTodayISO } from '../utils/time.js'
import { SCREENS } from '../constants/navigation.js'

const STATUS_OPTIONS = [
  { value: 'on_track', label: 'On Track' },
  { value: 'needs_adjustment', label: 'Needs adjustment' },
  { value: 'starting_over', label: 'Starting over' },
]

export default function Plan({ onNavigate }) {
  const { planningState, planningDispatch } = usePlanning()
  const today = getTodayISO()
  const existing = planningState.dailyPlans?.[today] ?? {
    status: null,
    currentFocus: '',
    priorities: ['', '', ''],
    notes: '',
  }

  const [status, setStatus] = useState(existing.status)
  const [currentFocus, setCurrentFocus] = useState(existing.currentFocus || '')
  const [priorities, setPriorities] = useState(existing.priorities || ['', '', ''])
  const [notes, setNotes] = useState(existing.notes || '')

  function updatePriority(index, value) {
    setPriorities(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  function savePlan() {
    planningDispatch({
      type: 'SET_DAILY_PLAN',
      payload: {
        date: today,
        plan: {
          status: status || null,
          currentFocus: currentFocus.trim(),
          priorities: priorities.map(p => p.trim()),
          notes: notes.trim(),
          updatedAt: new Date().toISOString(),
        },
      },
    })
    onNavigate(SCREENS.HOME)
  }

  return (
    <main style={styles.screen}>
      <div style={styles.headerRow}>
        <button style={styles.backButton} onClick={() => onNavigate(SCREENS.HOME)}>
          Back
        </button>
        <div>
          <p style={styles.eyebrow}>Plan</p>
          <h1 style={styles.title}>Re-center for today</h1>
        </div>
      </div>

      <p style={styles.subtitle}>
        Pause, update what matters, and continue with a calmer next step.
      </p>

      <section style={styles.fieldset}>
        <p style={styles.label}>How is today feeling?</p>
        <div style={styles.radioGrid}>
          {STATUS_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              style={{
                ...styles.radioOption,
                ...(status === option.value ? styles.radioOptionActive : {}),
              }}
              onClick={() => setStatus(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section style={styles.fieldset}>
        <label style={styles.label} htmlFor="plan-current-focus">
          Current focus
        </label>
        <input
          id="plan-current-focus"
          style={styles.input}
          value={currentFocus}
          onChange={event => setCurrentFocus(event.target.value)}
          placeholder="What do I want to move forward with next?"
        />
      </section>

      <section style={styles.fieldset}>
        <p style={styles.label}>Top 3 priorities</p>
        {[0, 1, 2].map(index => (
          <input
            key={index}
            style={styles.input}
            value={priorities[index] || ''}
            onChange={event => updatePriority(index, event.target.value)}
            placeholder={`Priority ${index + 1}`}
          />
        ))}
      </section>

      <section style={styles.fieldset}>
        <label style={styles.label} htmlFor="plan-notes">
          Notes
        </label>
        <textarea
          id="plan-notes"
          style={styles.textarea}
          value={notes}
          onChange={event => setNotes(event.target.value)}
          placeholder="Context, obstacles, reminders, or thoughts"
          rows={5}
        />
      </section>

      <div style={styles.actions}>
        <button style={styles.primaryButton} onClick={savePlan}>
          Save & continue
        </button>
        <button style={styles.secondaryButton} onClick={() => onNavigate(SCREENS.HOME)}>
          Close
        </button>
      </div>

      <p style={styles.tip}>
        Plan is a quick, low-pressure check-in. Empty fields are okay.
      </p>
    </main>
  )
}

const styles = {
  screen: {
    padding: '24px',
    minHeight: '100%',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '20px',
  },
  backButton: {
    border: '1px solid var(--color-border)',
    background: 'transparent',
    color: 'var(--color-text)',
    borderRadius: '12px',
    padding: '10px 12px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  eyebrow: {
    margin: 0,
    color: 'var(--color-muted)',
    fontSize: '11px',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
  },
  title: {
    margin: '6px 0 0',
    fontSize: '28px',
    lineHeight: 1.15,
  },
  subtitle: {
    margin: '0 0 26px',
    color: 'var(--color-muted)',
    maxWidth: '33rem',
    fontSize: '15px',
    lineHeight: 1.6,
  },
  fieldset: {
    display: 'grid',
    gap: '10px',
    marginBottom: '20px',
  },
  label: {
    margin: 0,
    color: 'var(--color-text)',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  radioGrid: {
    display: 'grid',
    gap: '10px',
  },
  radioOption: {
    border: '1px solid var(--color-border)',
    borderRadius: '14px',
    padding: '12px 14px',
    background: 'transparent',
    color: 'var(--color-text)',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
  },
  radioOptionActive: {
    background: 'var(--color-card)',
    borderColor: 'var(--color-accent)',
  },
  input: {
    width: '100%',
    border: '1px solid var(--color-border)',
    borderRadius: '14px',
    padding: '14px 16px',
    background: 'var(--color-card)',
    color: 'var(--color-text)',
    fontSize: '14px',
  },
  textarea: {
    width: '100%',
    border: '1px solid var(--color-border)',
    borderRadius: '14px',
    padding: '14px 16px',
    background: 'var(--color-card)',
    color: 'var(--color-text)',
    fontSize: '14px',
    resize: 'vertical',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '10px',
  },
  primaryButton: {
    border: 'none',
    borderRadius: '14px',
    padding: '14px 16px',
    background: 'var(--color-accent)',
    color: 'white',
    fontSize: '15px',
    cursor: 'pointer',
  },
  secondaryButton: {
    border: '1px solid var(--color-border)',
    borderRadius: '14px',
    padding: '14px 16px',
    background: 'transparent',
    color: 'var(--color-text)',
    fontSize: '15px',
    cursor: 'pointer',
  },
  tip: {
    marginTop: '16px',
    color: 'var(--color-muted)',
    fontSize: '13px',
    lineHeight: 1.5,
  },
}
