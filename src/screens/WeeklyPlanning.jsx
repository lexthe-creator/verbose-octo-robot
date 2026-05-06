import { useState, useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useDay } from '../context/index.js'
import { getTypeForDay, getWeekNumber } from '../utils/fitness.js'
import { getProjectPace } from '../utils/projectUtils.js'

// ─── Helpers ───────────────────────────────────────────────────────────────────

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const TYPE_ABBR = {
  easy_run:   'R',
  tempo_run:  'R',
  long_run:   'R',
  strength_a: 'US',
  strength_b: 'LS',
  stretch:    'ST',
  rest:       '—',
}

function getNextWeekDates() {
  const today = new Date()
  const day   = today.getDay()
  // days until next Monday (even if today is Monday, we want next week)
  const daysToMon = day === 0 ? 1 : 8 - day
  const mon = new Date(today)
  mon.setDate(today.getDate() + daysToMon)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return d
  })
}

function startOfWeek() {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(now)
  mon.setDate(now.getDate() + diff)
  mon.setHours(0, 0, 0, 0)
  return mon
}

// ─── Grocery swipe-to-delete row ──────────────────────────────────────────────

function GroceryRow({ item, onToggle, onDelete }) {
  const [offset, setOffset]   = useState(0)
  const [swiping, setSwiping] = useState(false)
  const startX   = useRef(null)
  const dragging = useRef(false)
  const THRESHOLD = 72

  function onTouchStart(e) { startX.current = e.touches[0].clientX; setSwiping(true) }
  function onTouchMove(e) {
    if (startX.current === null) return
    // swipe left = negative delta → show delete zone
    const delta = Math.min(0, e.touches[0].clientX - startX.current)
    setOffset(delta)
  }
  function onTouchEnd() {
    if (offset <= -THRESHOLD) onDelete()
    setOffset(0); setSwiping(false); startX.current = null
  }
  function onMouseDown(e) { startX.current = e.clientX; dragging.current = true; setSwiping(true) }
  function onMouseMove(e) {
    if (!dragging.current) return
    setOffset(Math.min(0, e.clientX - startX.current))
  }
  function onMouseUp() {
    if (!dragging.current) return
    dragging.current = false
    if (offset <= -THRESHOLD) onDelete()
    setOffset(0); setSwiping(false); startX.current = null
  }
  function onMouseLeave() {
    if (!dragging.current) return
    dragging.current = false; setOffset(0); setSwiping(false); startX.current = null
  }

  const deleteProgress = Math.min(1, Math.abs(offset) / THRESHOLD)

  return (
    <div style={gr.outer}>
      {/* Delete zone revealed on swipe left */}
      <div style={{ ...gr.deleteZone, opacity: deleteProgress }}>
        <span style={gr.deleteLabel}>Delete</span>
      </div>
      <div
        style={{
          ...gr.row,
          transform:  `translateX(${offset}px)`,
          transition: swiping ? 'none' : 'transform 0.25s ease-out',
        }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}   onMouseMove={onMouseMove}  onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        <button style={gr.checkBtn} onClick={onToggle}>
          <div style={{
            ...gr.check,
            background:  item.done ? 'var(--color-success)' : 'transparent',
            borderColor: item.done ? 'var(--color-success)' : 'var(--color-border)',
          }}>
            {item.done && <span style={gr.checkMark}>✓</span>}
          </div>
        </button>
        <span style={{
          ...gr.text,
          textDecoration: item.done ? 'line-through' : 'none',
          color:          item.done ? 'var(--color-muted)' : 'var(--color-text)',
          opacity:        item.done ? 0.6 : 1,
        }}>
          {item.text}
        </span>
      </div>
    </div>
  )
}

const gr = {
  outer:       { position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--color-card)', border: 'var(--border)' },
  deleteZone:  { position: 'absolute', right: 0, top: 0, bottom: 0, width: '72px', background: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  deleteLabel: { fontSize: '12px', fontWeight: 700, color: '#fff' },
  row:         { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'var(--color-card)', userSelect: 'none', touchAction: 'pan-y' },
  checkBtn:    { background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0 },
  check:       { width: '18px', height: '18px', borderRadius: '4px', border: '1.5px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s, border-color 0.15s' },
  checkMark:   { fontSize: '10px', color: '#fff', fontWeight: 700 },
  text:        { fontSize: '14px', flex: 1, transition: 'color 0.15s, opacity 0.15s' },
}

// ─── Main component ────────────────────────────────────────────────────────────

const STEPS = ['week-review', 'priorities', 'grocery', 'training', 'projects', 'done']

export default function WeeklyPlanning({ onComplete }) {
  const { state, dispatch } = useApp()
  const { dayState }        = useDay()

  const [stepIdx,      setStepIdx]      = useState(0)
  const [priorities,   setPriorities]   = useState(['', '', ''])
  const [groceryDraft, setGroceryDraft] = useState('')
  const [projectStep,  setProjectStep]  = useState(0)  // index within active projects
  const groceryRef = useRef(null)

  const step = STEPS[stepIdx]

  function next() {
    let idx = stepIdx + 1
    // skip project step if no active projects
    if (STEPS[idx] === 'projects' && activeProjects.length === 0) idx++
    setStepIdx(idx)
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekStart  = startOfWeek()
  const weekEnd    = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  const workoutsThisWeek = state.fitness.workoutLog.filter(e => {
    const d = new Date(e.date)
    return d >= weekStart && d < weekEnd
  }).length

  const tasksDoneCount = dayState.tasks.filter(t => t.done).length

  const ssProject   = state.projects?.[0]
  const ssThisWeek  = ssProject?.tasks.filter(t => t.done).length ?? 0

  const nextWeekDates = getNextWeekDates()
  const nextWeekTypes = nextWeekDates.map(d => getTypeForDay(d.getDay()))
  const runDays       = nextWeekTypes.filter(t => ['easy_run','tempo_run','long_run'].includes(t)).length
  const strengthDays  = nextWeekTypes.filter(t => ['strength_a','strength_b'].includes(t)).length

  const activeProjects = state.projects.filter(p => new Date(p.endDate) > today)

  // ── Step: Week review ──────────────────────────────────────────────────────
  if (step === 'week-review') {
    return (
      <div style={s.overlay}>
        <div style={s.inner}>
          <p style={s.eyebrow}>Weekly planning</p>
          <h1 style={s.heading}>This week</h1>

          <div style={s.statList}>
            {[
              { num: workoutsThisWeek, label: 'workouts completed' },
              { num: tasksDoneCount,   label: 'tasks done' },
              { num: ssThisWeek,       label: 'She Stitches tasks' },
            ].map(r => (
              <div key={r.label} style={s.statRow}>
                <span style={s.statNum}>{r.num}</span>
                <span style={s.statLabel}>{r.label}</span>
              </div>
            ))}
          </div>

          <button style={s.cta} onClick={next}>Next →</button>
        </div>
      </div>
    )
  }

  // ── Step: 3 big things ─────────────────────────────────────────────────────
  if (step === 'priorities') {
    return (
      <div style={s.overlay}>
        <div style={s.inner}>
          <p style={s.eyebrow}>Weekly planning</p>
          <h1 style={s.heading}>3 big things next week.</h1>

          <div style={s.priorityList}>
            {priorities.map((val, i) => (
              <div key={i} style={s.priorityRow}>
                <span style={s.priorityNum}>{i + 1}</span>
                <input
                  style={s.priorityInput}
                  type="text"
                  placeholder="Optional"
                  value={val}
                  onChange={e => {
                    const next = [...priorities]
                    next[i] = e.target.value
                    setPriorities(next)
                  }}
                />
              </div>
            ))}
          </div>

          <button
            style={s.cta}
            onClick={() => {
              const filled = priorities.filter(p => p.trim())
              dispatch({ type: 'SET_WEEKLY_PRIORITIES', payload: { priorities: filled } })
              next()
            }}
          >
            Next →
          </button>
        </div>
      </div>
    )
  }

  // ── Step: Grocery list ─────────────────────────────────────────────────────
  if (step === 'grocery') {
    function addGrocery() {
      const text = groceryDraft.trim()
      if (!text) return
      dispatch({ type: 'ADD_GROCERY_ITEM', payload: { text } })
      setGroceryDraft('')
    }

    return (
      <div style={s.overlay}>
        <div style={{ ...s.inner, maxHeight: '80dvh', overflowY: 'auto' }}>
          <p style={s.eyebrow}>Weekly planning</p>
          <h1 style={s.heading}>Anything to grab this week?</h1>

          {/* Add row */}
          <div style={s.addRow}>
            <input
              ref={groceryRef}
              style={s.addInput}
              type="text"
              placeholder="Item name"
              value={groceryDraft}
              onChange={e => setGroceryDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addGrocery()}
            />
            <button
              style={{ ...s.addBtn, opacity: groceryDraft.trim() ? 1 : 0.35 }}
              onClick={addGrocery}
            >↑</button>
          </div>

          {/* Existing items */}
          {state.groceryList.length > 0 && (
            <div style={s.groceryList}>
              {state.groceryList.map(item => (
                <GroceryRow
                  key={item.id}
                  item={item}
                  onToggle={() => dispatch({ type: 'TOGGLE_GROCERY_ITEM', payload: { id: item.id } })}
                  onDelete={() => dispatch({ type: 'DELETE_GROCERY_ITEM', payload: { id: item.id } })}
                />
              ))}
            </div>
          )}

          <button style={s.cta} onClick={next}>Next →</button>
        </div>
      </div>
    )
  }

  // ── Step: Training preview ─────────────────────────────────────────────────
  if (step === 'training') {
    return (
      <div style={s.overlay}>
        <div style={s.inner}>
          <p style={s.eyebrow}>Weekly planning</p>
          <h1 style={s.heading}>Next week's training.</h1>

          {/* 7-day strip */}
          <div style={s.strip}>
            {nextWeekDates.map((date, i) => {
              const type = nextWeekTypes[i]
              const abbr = TYPE_ABBR[type] || '—'
              return (
                <div key={i} style={s.stripCell}>
                  <span style={s.stripDay}>{DAY_LABELS[i]}</span>
                  <span style={s.stripAbbr}>{abbr}</span>
                </div>
              )
            })}
          </div>

          <p style={s.trainingSummary}>
            {runDays} run day{runDays !== 1 ? 's' : ''} · {strengthDays} strength day{strengthDays !== 1 ? 's' : ''}
          </p>

          <button style={s.cta} onClick={next}>Looks good →</button>
        </div>
      </div>
    )
  }

  // ── Step: Project check-ins ────────────────────────────────────────────────
  if (step === 'projects') {
    const project = activeProjects[projectStep]
    if (!project) { next(); return null }

    const pace = getProjectPace(project)
    const daysRem = Math.max(0, Math.ceil((new Date(project.endDate) - today) / 86_400_000))
    const tasksDoneThisWeek = project.tasks.filter(t => t.done).length
    const tasksRemaining    = project.tasks.filter(t => !t.done).length
    const catchUp = daysRem > 0 ? Math.ceil((tasksRemaining / daysRem) * 7) : tasksRemaining

    const PACE_LABELS = { on_track: 'On track', buffer: '7 days buffer', behind: 'Behind' }
    const PACE_COLORS = {
      on_track: { bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
      buffer:   { bg: 'var(--color-buffer-bg)',   color: 'var(--color-buffer)' },
      behind:   { bg: 'rgba(224,85,85,0.12)',    color: 'var(--color-danger)' },
    }
    const pc = PACE_COLORS[pace.status] ?? PACE_COLORS.on_track

    function advanceProject() {
      if (projectStep + 1 < activeProjects.length) {
        setProjectStep(p => p + 1)
      } else {
        next()
      }
    }

    return (
      <div style={s.overlay}>
        <div style={s.inner}>
          <p style={s.eyebrow}>Weekly planning</p>
          <div style={s.projectHeader}>
            <span style={s.projectEmoji}>{project.emoji}</span>
            <h1 style={s.headingMd}>{project.name}</h1>
            <span style={{ ...s.paceBadge, background: pc.bg, color: pc.color }}>
              {PACE_LABELS[pace.status]}
            </span>
          </div>

          <div style={s.statList}>
            <div style={s.statRow}>
              <span style={s.statNum}>{tasksDoneThisWeek}</span>
              <span style={s.statLabel}>tasks done</span>
            </div>
            <div style={s.statRow}>
              <span style={s.statNum}>{tasksRemaining}</span>
              <span style={s.statLabel}>tasks remaining</span>
            </div>
          </div>

          {pace.status === 'behind' && (
            <div style={s.catchUpCard}>
              <p style={s.catchUpText}>
                Suggested catch-up: <strong>{catchUp} tasks this week</strong> to get back on track
              </p>
            </div>
          )}

          <button style={s.cta} onClick={advanceProject}>
            {pace.status === 'behind' ? "I'll catch up →" : 'Looks good →'}
          </button>
        </div>
      </div>
    )
  }

  // ── Step: Done ─────────────────────────────────────────────────────────────
  return (
    <div style={s.overlay}>
      <div style={{ ...s.inner, alignItems: 'center', textAlign: 'center' }}>
        <span style={s.doneGlyph}>✦</span>
        <h1 style={s.headingLg}>Week planned.</h1>
        <p style={s.doneSub}>See you Sunday.</p>
        <button style={s.cta} onClick={onComplete}>Go to home →</button>
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  overlay: {
    position:       'fixed',
    inset:          0,
    zIndex:         200,
    background:     'var(--color-bg)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        '24px',
    paddingTop:     'calc(var(--safe-top) + 40px)',
    paddingBottom:  'calc(var(--safe-bottom) + 40px)',
    overflowY:      'auto',
  },
  inner: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '24px',
    width:         '100%',
    maxWidth:      '340px',
  },

  eyebrow: {
    fontSize:      '11px',
    fontWeight:    700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color:         'var(--color-muted)',
    marginBottom:  '-12px',
  },
  heading: {
    fontFamily: 'var(--font-display)',
    fontSize:   '32px',
    lineHeight: 1.15,
    color:      'var(--color-text)',
  },
  headingMd: {
    fontFamily: 'var(--font-display)',
    fontSize:   '26px',
    lineHeight: 1.15,
    color:      'var(--color-text)',
    flex:       1,
  },
  headingLg: {
    fontFamily: 'var(--font-display)',
    fontSize:   '40px',
    lineHeight: 1,
    color:      'var(--color-text)',
  },

  // Stat rows
  statList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  statRow: {
    display:    'flex',
    alignItems: 'baseline',
    gap:        '10px',
    padding:    '12px 14px',
    background: 'var(--color-card)',
    border:     'var(--border)',
    borderRadius: 'var(--radius-sm)',
  },
  statNum:   { fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--color-accent)', lineHeight: 1 },
  statLabel: { fontSize: '13px', color: 'var(--color-muted)' },

  // Priority list
  priorityList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  priorityRow:  { display: 'flex', alignItems: 'center', gap: '12px' },
  priorityNum: {
    fontFamily: 'var(--font-display)',
    fontSize:   '22px',
    color:      'var(--color-accent)',
    width:      '20px',
    flexShrink: 0,
    lineHeight: 1,
  },
  priorityInput: {
    flex:           1,
    padding:        '12px 14px',
    background:     'var(--color-card)',
    border:         'var(--border)',
    borderRadius:   'var(--radius-sm)',
    fontSize:       '14px',
    color:          'var(--color-text)',
    outline:        'none',
    fontFamily:     'var(--font-body)',
  },

  // Grocery
  addRow: {
    display:      'flex',
    gap:          '8px',
    background:   'var(--color-card)',
    border:       'var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding:      '10px 14px',
    alignItems:   'center',
  },
  addInput: {
    flex:       1,
    fontSize:   '14px',
    color:      'var(--color-text)',
    background: 'none',
    border:     'none',
    outline:    'none',
    fontFamily: 'var(--font-body)',
  },
  addBtn: {
    width:           '28px',
    height:          '28px',
    borderRadius:    '50%',
    background:      'var(--color-accent)',
    border:          'none',
    color:           '#fff',
    fontSize:        '14px',
    fontWeight:      700,
    cursor:          'pointer',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
    transition:      'opacity 0.15s',
  },
  groceryList: { display: 'flex', flexDirection: 'column', gap: '8px' },

  // Weekly strip
  strip: {
    display:             'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap:                 '4px',
  },
  stripCell: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            '4px',
    padding:        '8px 0',
    background:     'var(--color-card)',
    borderRadius:   'var(--radius-sm)',
    border:         'var(--border)',
  },
  stripDay:  { fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)', lineHeight: 1 },
  stripAbbr: { fontSize: '10px', fontWeight: 600, color: 'var(--color-faint)', lineHeight: 1 },
  trainingSummary: {
    fontSize:  '12px',
    color:     'var(--color-muted)',
    textAlign: 'center',
    marginTop: '-10px',
  },

  // Project check-in
  projectHeader: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
  },
  projectEmoji: { fontSize: '22px', lineHeight: 1, flexShrink: 0 },
  paceBadge: {
    flexShrink:   0,
    fontSize:     '10px',
    fontWeight:   700,
    padding:      '3px 9px',
    borderRadius: 'var(--radius-pill)',
    letterSpacing:'0.04em',
  },
  catchUpCard: {
    padding:      '12px 14px',
    background:   'rgba(224,85,85,0.08)',
    border:       '0.5px solid var(--color-danger)',
    borderRadius: 'var(--radius-sm)',
  },
  catchUpText: {
    fontSize:   '13px',
    color:      'var(--color-text)',
    lineHeight: 1.5,
  },

  // Done screen
  doneGlyph: { fontSize: '40px', color: 'var(--color-accent)', lineHeight: 1 },
  doneSub:   { fontSize: '14px', color: 'var(--color-muted)', marginTop: '-12px' },

  // Shared CTA
  cta: {
    width:        '100%',
    padding:      '16px',
    borderRadius: 'var(--radius-card)',
    background:   'var(--color-accent)',
    color:        '#fff',
    fontSize:     '16px',
    fontWeight:   600,
    textAlign:    'center',
    cursor:       'pointer',
    border:       'none',
    transition:   'opacity 0.2s',
  },
}
