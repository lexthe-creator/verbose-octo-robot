import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { getPhase, PHASE_LABELS } from '../utils/fitness.js'

const EQUIPMENT_OPTIONS = [
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'dumbbells',  label: 'Dumbbells'  },
  { value: 'gym',        label: 'Full gym'   },
]

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function Settings({ onBack }) {
  const { state, dispatch } = useApp()
  const [nameDraft, setNameDraft] = useState(state.profile.name)
  const [sheetKind, setSheetKind] = useState(null)  // 'plaid' | 'calendar' | null

  function handleNameBlur() {
    const clean = nameDraft.trim()
    if (!clean) { setNameDraft(state.profile.name); return }
    if (clean === state.profile.name) return
    dispatch({ type: 'UPDATE_PROFILE', payload: { name: clean } })
  }

  function handleEquipment(value) {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { key: 'gymAccess', value } })
  }

  const phaseKey = getPhase(state.fitness.weekNumber)

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
              const active = state.settings.gymAccess === opt.value
              return (
                <button
                  key={opt.value}
                  style={{
                    ...s.pill,
                    background:  active ? '#2A1F14'                 : '#252520',
                    border:      active ? '0.5px solid #C17B56'     : '0.5px solid #2A2A22',
                    color:       active ? '#C17B56'                 : '#4A4A40',
                    fontWeight:  active ? 600                       : 500,
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
      </section>

      {/* Connections */}
      <section style={s.card}>
        <p style={s.cardLabel}>Connections</p>
        <ConnectionRow
          title="Plaid"
          subtitle="Bank & spending"
          connected={state.settings.plaidConnected}
          onConnect={() => setSheetKind('plaid')}
        />
        <div style={s.divider} />
        <ConnectionRow
          title="Google Calendar"
          subtitle="Sync events"
          connected={state.settings.calendarConnected}
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
          <span style={s.aboutRight}>Week {state.fitness.weekNumber}</span>
        </div>
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
    fontSize:   '24px',
    color:      'var(--color-text)',
    lineHeight: 1,
  },

  // Card
  card: {
    margin:       '0 20px',
    background:   '#1E1E18',
    border:       '0.5px solid #2A2A22',
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
    background:   '#252520',
    border:       '0.5px solid #2A2A22',
    borderRadius: '10px',
    color:        '#F6F3EF',
    fontFamily:   'var(--font-body)',
    fontSize:     '15px',
    padding:      '0 12px',
    outline:      'none',
    width:        '100%',
  },
  helper: {
    fontSize: '10px',
    color:    '#3A3A30',
    lineHeight: 1.4,
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
    background:   '#0C2A1E',
    color:        '#1D9E75',
    border:       '0.5px solid #1A4028',
    fontSize:     '11px',
    fontWeight:   600,
    flexShrink:   0,
  },
  connectBtn: {
    background: 'none',
    border:     'none',
    color:      '#C17B56',
    fontSize:   '13px',
    fontWeight: 600,
    cursor:     'pointer',
    padding:    0,
    flexShrink: 0,
  },
  divider: {
    height:     '0.5px',
    background: '#2A2A22',
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
    background:           '#1E1E18',
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
