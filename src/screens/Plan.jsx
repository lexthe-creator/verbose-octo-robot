import { useState } from 'react'
import { usePlanning } from '../context/index.js'
import { getTodayISO } from '../utils/time.js'
import { SCREENS } from '../constants/navigation.js'

const MODE_OPTIONS = [
  { value: 'refocus', label: 'Refocus', prompt: 'what matters most next?' },
  { value: 'simplify', label: 'Simplify', prompt: 'what can wait?' },
  { value: 'continue', label: 'Continue', prompt: 'what is the next step?' },
]

export default function Plan({ onNavigate }) {
  const { planningState, planningDispatch } = usePlanning()
  const today = getTodayISO()
  const existing = planningState.dailyPlans?.[today] ?? { mode: null, response: '', updatedAt: null }

  const [mode, setMode] = useState(existing.mode)
  const [response, setResponse] = useState(existing.response || '')

  function savePlan() {
    planningDispatch({
      type: 'SET_DAILY_PLAN',
      payload: {
        date: today,
        plan: {
          mode: mode || null,
          response: response.trim(),
          updatedAt: new Date().toISOString(),
        },
      },
    })
    onNavigate(SCREENS.HOME)
  }

  const selectedMode = MODE_OPTIONS.find(option => option.value === mode)

  return (
    <main style={styles.screen}>
      <div style={styles.headerRow}>
        <button style={styles.backButton} onClick={() => onNavigate(SCREENS.HOME)}>
          ←
        </button>
        <div>
          <p style={styles.eyebrow}>PLAN</p>
          <h1 style={styles.title}>your day can still reflow</h1>
        </div>
      </div>

      <section style={styles.fieldset}>
        <p style={styles.question}>what do you need right now?</p>
        <div style={styles.modeRow}>
          {MODE_OPTIONS.map(option => {
            const active = mode === option.value
            return (
              <button
                key={option.value}
                type="button"
                style={{
                  ...styles.modeChip,
                  ...(active ? styles.modeChipActive : {}),
                }}
                onClick={() => setMode(option.value)}
              >
                <span style={styles.modeMarker}>{active ? '●' : '○'}</span>
                <span>{option.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      {selectedMode && (
        <section style={styles.fieldset}>
          <p style={styles.prompt}>{selectedMode.prompt}</p>
          <textarea
            style={styles.textarea}
            value={response}
            onChange={event => setResponse(event.target.value)}
            placeholder="write it down..."
            rows={5}
          />
        </section>
      )}

      <div style={styles.actions}>
        <button style={styles.saveButton} onClick={savePlan}>
          save & continue
        </button>
        <button style={styles.closeButton} onClick={() => onNavigate(SCREENS.HOME)}>
          close
        </button>
      </div>
    </main>
  )
}

const styles = {
  screen: {
    padding: '22px 22px 28px',
    minHeight: '100%',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '18px',
  },
  backButton: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: '0.5px solid color-mix(in srgb, var(--color-border) 62%, transparent)',
    background: 'transparent',
    color: 'var(--color-muted)',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
  },
  eyebrow: {
    margin: 0,
    color: 'var(--color-muted)',
    fontSize: '11px',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
  },
  title: {
    margin: '6px 0 0',
    fontSize: '18px',
    lineHeight: 1.3,
    fontWeight: 600,
  },
  fieldset: {
    display: 'grid',
    gap: '12px',
    marginBottom: '20px',
  },
  question: {
    margin: 0,
    color: 'var(--color-text)',
    fontSize: '14px',
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
  modeRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  modeChip: {
    border: 'none',
    background: 'transparent',
    color: 'var(--color-muted)',
    padding: '6px 0',
    minWidth: '80px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  modeChipActive: {
    color: 'var(--color-accent)',
    fontWeight: 700,
  },
  modeMarker: {
    display: 'inline-flex',
    width: '18px',
    justifyContent: 'center',
    fontSize: '14px',
    lineHeight: 1,
  },
  prompt: {
    margin: 0,
    color: 'var(--color-text)',
    fontSize: '15px',
    fontWeight: 700,
  },
  textarea: {
    width: '100%',
    border: 'none',
    borderBottom: '1px solid var(--color-border)',
    background: 'transparent',
    color: 'var(--color-text)',
    fontSize: '15px',
    lineHeight: 1.8,
    padding: '8px 0',
    resize: 'vertical',
    minHeight: '120px',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginTop: '10px',
  },
  saveButton: {
    border: '1px solid var(--color-accent)',
    borderRadius: '999px',
    background: 'transparent',
    color: 'var(--color-accent)',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  closeButton: {
    border: 'none',
    background: 'transparent',
    color: 'var(--color-muted)',
    fontSize: '14px',
    cursor: 'pointer',
  },
}
