import { useState, useEffect } from 'react'
import { useUser } from '../context/UserContext.jsx'
import { useSettings } from '../context/SettingsContext.jsx'
import { useFitness } from '../context/index.js'
import { getPhase, getWeekNumber } from '../utils/fitness.js'
import { GYM_ACCESS, PHASE_LABELS } from '../constants/fitness.js'
import { SCREENS } from '../constants/navigation.js'
import { THEMES } from '../constants/theme.js'

const EQUIPMENT_OPTIONS = [
  { value: GYM_ACCESS.BODYWEIGHT, label: 'Bodyweight' },
  { value: GYM_ACCESS.DUMBBELLS,  label: 'Dumbbells'  },
  { value: GYM_ACCESS.GYM,        label: 'Full gym'   },
]

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function Settings({ onBack, onNavigate }) {
  const { userState, userDispatch }         = useUser()
  const { settingsState, settingsDispatch } = useSettings()
  const { fitnessState, fitnessDispatch }   = useFitness()
  const [nameDraft, setNameDraft] = useState(userState.name)
  const [sheetKind, setSheetKind] = useState(null)  // 'plaid' | 'calendar' | null

  function handleNameBlur() {
    const clean = nameDraft.trim()
    if (!clean) { setNameDraft(userState.name); return }
    if (clean === userState.name) return
    userDispatch({ type: 'UPDATE_PROFILE', payload: { key: 'name', value: clean } })
  }

  function handleEquipment(value) {
    settingsDispatch({ type: 'UPDATE_SETTING', payload: { key: 'gymAccess', value } })
  }

  const { programStartDate, programEndDate } = fitnessState
  const phaseKey = getPhase(programStartDate, programEndDate)
  const weekNum  = getWeekNumber(programStartDate)

  return (
    <div style={s.screen}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>← Home</button>
        <h1 style={s.title}>Settings</h1>
      </div>

      {/* Profile */}
      <section style={s.card}>
        <p style={s.cardLabel}>Profile</p>
        <div style={s.field}>
          <label style={s.fieldLabel}>Your name</label>
          <input
            type="text"
            style={s.input}
            value={nameDraft}
            onChange={e => setNameDraft(e.target.value)}
            onBlur={handleNameBlur}
          />
        </div>
      </section>

      {/* Training */}
      <section style={s.card}>
        <p style={s.cardLabel}>Training</p>
        <div style={s.field}>
          <label style={s.fieldLabel}>Equipment</label>
          <div style={s.pillRow}>
            {EQUIPMENT_OPTIONS.map(opt => {
              const active = settingsState.gymAccess === opt.value
              return (
                <button
                  key={opt.value}
                  style={{
                    ...s.pill,
                    background:  active ? 'var(--color-accent-bg)'            : 'var(--color-chart-bar)',
                    border:      active ? '0.5px solid var(--color-accent)'   : 'var(--border)',
                    color:       active ? 'var(--color-accent)'               : 'var(--color-faint)',
                    fontWeight:  active ? 600                                  : 500,
                  }}
                  onClick={() => handleEquipment(opt.value)}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          <p style={s.helper}>
            Controls what exercises get generated in your workouts
          </p>
        </div>
        <div style={s.divider} />
        <button
          style={s.editProgramBtn}
          onClick={() => onNavigate?.(SCREENS.FITNESS_SETUP)}
        >
          Edit training program →
        </button>
      </section>

      {/* Program */}
      <section style={s.card}>
        <p style={s.cardLabel}>Program</p>
        <div style={s.field}>
          <label style={s.fieldLabel}>Start date</label>
          <input
            type="date"
            style={s.input}
            value={programStartDate || ''}
            onChange={e => fitnessDispatch({
              type:    'UPDATE_FITNESS',
              payload: { key: 'programStartDate', value: e.target.value || null },
            })}
          />
        </div>
        <div style={s.field}>
          <label style={s.fieldLabel}>Race date</label>
          <input
            type="date"
            style={s.input}
            value={programEndDate || ''}
            onChange={e => fitnessDispatch({
              type:    'UPDATE_FITNESS',
              payload: { key: 'programEndDate', value: e.target.value || null },
            })}
          />
        </div>
        <p style={s.helper}>
          Phase and week number are calculated from these dates
        </p>
      </section>

      {/* Connections */}
      <section style={s.card}>
        <p style={s.cardLabel}>Connections</p>
        <ConnectionRow
          title="Plaid"
          subtitle="Bank & spending"
          connected={settingsState.plaidConnected}
          onConnect={() => setSheetKind('plaid')}
        />
        <div style={s.divider} />
        <ConnectionRow
          title="Google Calendar"
          subtitle="Sync events"
          connected={settingsState.calendarConnected}
          onConnect={() => setSheetKind('calendar')}
        />
      </section>

      {/* About */}
      <section style={s.card}>
        <p style={s.cardLabel}>About</p>
        <div style={s.aboutRow}>
          <span style={s.aboutLeft}>App in My Life</span>
          <span style={s.aboutRight}>V1 — Personal OS</span>
        </div>
        <div style={s.divider} />
        <div style={s.aboutRow}>
          <span style={s.aboutLeft}>Phase</span>
          <span style={s.aboutRightAccent}>{PHASE_LABELS[phaseKey]}</span>
        </div>
        <div style={s.divider} />
        <div style={s.aboutRow}>
          <span style={s.aboutLeft}>Week</span>
          <span style={s.aboutRight}>Week {weekNum}</span>
        </div>
      </section>

      {/* Appearance */}
      <section style={s.card}>
        <p style={s.cardLabel}>Appearance</p>
        <div style={s.field}>
          <label style={s.fieldLabel}>Theme</label>
          <div style={{ ...s.pillRow, gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {[THEMES.DARK, THEMES.LIGHT].map(theme => {
              const active = (settingsState.theme || THEMES.DARK) === theme
              return (
                <button
                  key={theme}
                  style={{
                    ...s.pill,
                    background: active ? 'var(--color-accent-bg)'          : 'var(--color-chart-bar)',
                    border:     active ? '0.5px solid var(--color-accent)'  : 'var(--border)',
                    color:      active ? 'var(--color-accent)'              : 'var(--color-faint)',
                    fontWeight: active ? 600                                 : 500,
                  }}
                  onClick={() => settingsDispatch({ type: 'UPDATE_SETTING', payload: { key: 'theme', value: theme } })}
                >
                  {theme === 'dark' ? '◑ Dark' : '◐ Light'}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Debug — remove before App Store submission */}
      <section style={s.card}>
        <p style={s.debugLabel}>DEBUG — remove before App Store submission</p>
        <button
          style={s.debugBtn}
          onClick={() => {
            localStorage.removeItem('aiml_fitness')
            localStorage.removeItem('lastReflectionDate')
            localStorage.removeItem('lastWeeklyPlanDate')
            window.location.reload()
          }}
        >
          Reset fitness program
        </button>
        <button
          style={s.debugBtn}
          onClick={() => {
            localStorage.removeItem('aiml_projects')
            localStorage.removeItem('lastReflectionDate')
            localStorage.removeItem('lastWeeklyPlanDate')
            window.location.reload()
          }}
        >
          Reset project data
        </button>
      </section>

      {sheetKind && (
        <StubSheet kind={sheetKind} onClose={() => setSheetKind(null)} />
      )}
    </div>
  )
}

// ─── Connection row ──────────────────────────────────────────────────────────

function ConnectionRow({ title, subtitle, connected, onConnect }) {
  return (
    <div style={s.connRow}>
      <div style={s.connText}>
        <p style={s.connTitle}>{title}</p>
        <p style={s.connSub}>{subtitle}</p>
      </div>
      {connected ? (
        <span style={s.connectedBadge}>● Connected</span>
      ) : (
        <button style={s.connectBtn} onClick={onConnect}>Connect →</button>
      )}
    </div>
  )
}

// ─── Stub bottom sheet (Plaid / Calendar V2 placeholder) ─────────────────────

function StubSheet({ kind, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  const copy = kind === 'plaid'
    ? {
        title: 'Connect Plaid',
        body:  'Plaid integration coming in V2. Your spending data will sync automatically once connected.',
      }
    : {
        title: 'Connect Google Calendar',
        body:  'Calendar integration coming in V2. Items sent to "Calendar" from your inbox will create events once connected.',
      }

  return (
    <div
      style={{
        ...sheet.backdrop,
        opacity:       visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          ...sheet.box,
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={sheet.title}>{copy.title}</h3>
        <p style={sheet.body}>{copy.body}</p>
        <button style={sheet.closeBtn} onClick={handleClose}>Close</button>
      </div>
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = {
  screen: {
    minHeight:     '100dvh',
    background:    'var(--color-bg)',
    paddingTop:    'calc(var(--safe-top) + var(--space-5))',
    paddingBottom: 'calc(var(--safe-bottom) + var(--space-10))',
    display:       'flex',
    flexDirection: 'column',
    gap:           'var(--space-4)',
  },

  // Header
  header: {
    padding:       '0 20px var(--space-2)',
    display:       'flex',
    flexDirection: 'column',
    gap:           'var(--space-2)',
  },
  backBtn: {
    alignSelf:   'flex-start',
    background:  'none',
    border:      'none',
    color:       'var(--color-muted)',
    fontSize:    '13px',
    fontWeight:  500,
    padding:     0,
    cursor:      'pointer',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize:   '22px',
    color:      'var(--color-text)',
    lineHeight: 1,
  },

  // Card
  card: {
    margin:       '0 20px',
    background:   'var(--color-card)',
    border:       'var(--border)',
    borderRadius: '14px',
    padding:      '16px',
    display:      'flex',
    flexDirection:'column',
    gap:          '12px',
  },
  cardLabel: {
    fontSize:      '10px',
    fontWeight:    600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color:         'var(--color-muted)',
  },
  field: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '8px',
  },
  fieldLabel: {
    fontSize:   '12px',
    color:      'var(--color-muted)',
    fontWeight: 500,
  },
  input: {
    height:       '40px',
    background:   'var(--color-chart-bar)',
    border:       'var(--border)',
    borderRadius: '10px',
    color:        'var(--color-text)',
    fontFamily:   'var(--font-body)',
    fontSize:     '15px',
    padding:      '0 12px',
    outline:      'none',
    width:        '100%',
  },
  helper: {
    fontSize:   '10px',
    color:      'var(--color-faint)',
    lineHeight: 1.4,
  },
  editProgramBtn: {
    alignSelf:  'flex-start',
    background: 'none',
    border:     'none',
    color:      'var(--color-accent)',
    fontSize:   '14px',
    fontWeight: 600,
    cursor:     'pointer',
    padding:    '6px 0',
  },

  // Equipment pill toggle
  pillRow: {
    display:            'grid',
    gridTemplateColumns:'repeat(3, 1fr)',
    gap:                '6px',
  },
  pill: {
    padding:      '10px 8px',
    borderRadius: 'var(--radius-pill)',
    fontSize:     '12px',
    cursor:       'pointer',
    textAlign:    'center',
    transition:   'background 0.15s, color 0.15s, border-color 0.15s',
  },

  // Connection rows
  connRow: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            '12px',
    padding:        '6px 0',
  },
  connText: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '2px',
    flex:          1,
    minWidth:      0,
  },
  connTitle: {
    fontSize:   '14px',
    fontWeight: 600,
    color:      'var(--color-text)',
  },
  connSub: {
    fontSize: '11px',
    color:    'var(--color-muted)',
  },
  connectedBadge: {
    padding:      '4px 10px',
    borderRadius: 'var(--radius-pill)',
    background:   'var(--color-success-bg)',
    color:        'var(--color-success)',
    border:       '0.5px solid var(--color-success)',
    fontSize:     '11px',
    fontWeight:   600,
    flexShrink:   0,
  },
  connectBtn: {
    background: 'none',
    border:     'none',
    color:      'var(--color-accent)',
    fontSize:   '13px',
    fontWeight: 600,
    cursor:     'pointer',
    padding:    0,
    flexShrink: 0,
  },
  divider: {
    height:     '0.5px',
    background: 'var(--color-border)',
    margin:     '2px 0',
  },

  // About rows
  aboutRow: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '6px 0',
  },
  aboutLeft: {
    fontSize: '13px',
    color:    'var(--color-text)',
    fontWeight: 500,
  },
  aboutRight: {
    fontSize: '12px',
    color:    'var(--color-muted)',
  },
  aboutRightAccent: {
    fontSize:   '12px',
    color:      'var(--color-accent)',
    fontWeight: 600,
  },

  // Debug section
  debugLabel: {
    fontSize:      '9px',
    fontWeight:    600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color:         'var(--color-danger)',
  },
  debugBtn: {
    width:        '100%',
    padding:      '10px',
    borderRadius: 'var(--radius-sm)',
    background:   'transparent',
    border:       '0.5px solid var(--color-danger-border)',
    color:        'var(--color-danger)',
    fontSize:     '12px',
    fontWeight:   500,
    cursor:       'pointer',
    marginBottom: '8px',
  },
}

const sheet = {
  backdrop: {
    position:       'fixed',
    inset:          0,
    background:     'rgba(0,0,0,0.6)',
    zIndex:         200,
    transition:     'opacity 250ms ease',
    display:        'flex',
    alignItems:     'flex-end',
    justifyContent: 'center',
  },
  box: {
    width:                '100%',
    maxWidth:             'var(--max-width)',
    background:           'var(--color-card)',
    borderTopLeftRadius:  '20px',
    borderTopRightRadius: '20px',
    padding:              '24px',
    paddingBottom:        'calc(24px + var(--safe-bottom))',
    transition:           'transform 250ms var(--ease-out)',
    display:              'flex',
    flexDirection:        'column',
    gap:                  '14px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize:   '20px',
    color:      'var(--color-text)',
    lineHeight: 1.2,
  },
  body: {
    fontSize:   '13px',
    color:      'var(--color-muted)',
    lineHeight: 1.5,
  },
  closeBtn: {
    width:        '100%',
    padding:      '14px',
    borderRadius: '12px',
    background:   'var(--color-accent)',
    color:        '#fff',
    fontSize:     '15px',
    fontWeight:   600,
    border:       'none',
    cursor:       'pointer',
    marginTop:    '4px',
  },
}
