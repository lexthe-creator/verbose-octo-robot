import { useState, useRef } from 'react'
import { useDay, usePlanning } from '../context/index.js'
import { parseHHMM } from '../utils/time.js'

const FEEL_OPTIONS = [
  { value: 1, emoji: '😴' },
  { value: 2, emoji: '😐' },
  { value: 3, emoji: '🙂' },
  { value: 4, emoji: '😄' },
  { value: 5, emoji: '⚡' },
]

// ─── Swipe-to-remove row ───────────────────────────────────────────────────────

function RemoveSwipeRow({ task, onRemove }) {
  const [offset, setOffset]   = useState(0)
  const [swiping, setSwiping] = useState(false)
  const startX   = useRef(null)
  const dragging = useRef(false)
  const THRESHOLD = 80

  function onTouchStart(e) {
    startX.current = e.touches[0].clientX
    setSwiping(true)
  }
  function onTouchMove(e) {
    if (startX.current === null) return
    setOffset(Math.max(0, e.touches[0].clientX - startX.current))
  }
  function onTouchEnd() {
    if (offset >= THRESHOLD) onRemove()
    setOffset(0); setSwiping(false); startX.current = null
  }

  function onMouseDown(e) {
    startX.current = e.clientX; dragging.current = true; setSwiping(true)
  }
  function onMouseMove(e) {
    if (!dragging.current) return
    setOffset(Math.max(0, e.clientX - startX.current))
  }
  function onMouseUp() {
    if (!dragging.current) return
    dragging.current = false
    if (offset >= THRESHOLD) onRemove()
    setOffset(0); setSwiping(false); startX.current = null
  }
  function onMouseLeave() {
    if (!dragging.current) return
    dragging.current = false; setOffset(0); setSwiping(false); startX.current = null
  }

  const progress = Math.min(offset / THRESHOLD, 1)

  return (
    <div
      style={{
        ...rsr.wrap,
        background: `rgba(224,85,85,${progress * 0.12})`,
        border:     `0.5px solid rgba(224,85,85,${Math.max(0.2, progress * 0.7)})`,
      }}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}   onMouseMove={onMouseMove}  onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      <div style={{
        ...rsr.inner,
        transform:  `translateX(${offset}px)`,
        transition: swiping ? 'none' : 'transform 0.25s ease-out',
      }}>
        <span style={rsr.text}>{task.text}</span>
        <span style={{ ...rsr.hint, opacity: progress }}>remove →</span>
      </div>
    </div>
  )
}

const rsr = {
  wrap:  { background: 'var(--color-card)', border: 'var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', userSelect: 'none', touchAction: 'pan-y' },
  inner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', gap: '8px' },
  text:  { fontSize: '15px', fontWeight: 500, color: 'var(--color-text)', flex: 1 },
  hint:  { fontSize: '12px', color: 'var(--color-danger)', fontWeight: 500, flexShrink: 0, transition: 'opacity 0.15s' },
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function EodReflection({ onComplete }) {
  const { planningDispatch }      = usePlanning()
  const { dayState, dayDispatch } = useDay()
  const [step,         setStep]         = useState('review')
  const [carrySet,     setCarrySet]     = useState(() => new Set())
  const [feel,         setFeel]         = useState(null)
  const [tomorrowList, setTomorrowList] = useState(null)
  const [addDraft,     setAddDraft]     = useState('')
  const addInputRef = useRef(null)

  const today = new Date().toISOString().slice(0, 10)

  function toggleCarry(id) {
    setCarrySet(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function buildTomorrow() {
    const nowMins    = new Date().getHours() * 60 + new Date().getMinutes()
    const carried    = dayState.tasks.filter(t => carrySet.has(t.id))
    const carriedIds = new Set(carried.map(t => t.id))
    const overdue    = dayState.tasks.filter(t =>
      !t.done && !carriedIds.has(t.id) && t.dueTime && parseHHMM(t.dueTime) < nowMins
    )
    const overdueIds = new Set(overdue.map(t => t.id))
    const scheduled  = dayState.tasks.filter(t =>
      !t.done && !carriedIds.has(t.id) && !overdueIds.has(t.id) && t.scheduledTime
    )
    return [...carried, ...overdue, ...scheduled].slice(0, 3)
  }

  function enterTomorrow() {
    if (tomorrowList === null) setTomorrowList(buildTomorrow())
    setStep('tomorrow')
  }

  function removeTask(id) {
    setTomorrowList(prev => prev.filter(t => t.id !== id))
  }

  function addTask() {
    const text = addDraft.trim()
    if (!text) return
    const list = tomorrowList || []
    if (list.length >= 3) return
    setTomorrowList([...list, { id: `eod_${Date.now()}`, text }])
    setAddDraft('')
  }

  function handleFinish() {
    const tasks = tomorrowList || []
    dayDispatch({ type: 'SET_TOMORROW_TASKS', payload: { tasks } })
    planningDispatch({ type: 'ADD_REFLECTION', payload: { date: today, feel, tomorrowTasks: tasks.map(t => t.text) } })
    onComplete()
  }

  // ── Step 1: Review ─────────────────────────────────────────────────────────
  if (step === 'review') {
    return (
      <div style={s.overlay}>
        <div style={s.inner}>
          <p style={s.eyebrow}>End of day</p>
          <h1 style={s.heading}>How did today go?</h1>

          <div style={s.taskList}>
            {dayState.tasks.map(task => (
              <div key={task.id} style={s.reviewRow}>
                <div style={{ ...s.statusDot, background: task.done ? 'var(--color-success)' : 'var(--color-faint)' }} />
                <span style={{
                  ...s.reviewText,
                  textDecoration: task.done ? 'line-through' : 'none',
                  opacity:        task.done ? 0.5 : 1,
                  color:          task.done ? 'var(--color-success)' : 'var(--color-text)',
                }}>
                  {task.text}
                </span>
                {!task.done && (
                  <div style={s.carryGroup}>
                    <span style={s.carryLabel}>carry?</span>
                    <button
                      style={{ ...s.carryPill, ...(carrySet.has(task.id) ? s.carryActive : s.carryInactive) }}
                      onClick={() => { if (!carrySet.has(task.id)) toggleCarry(task.id) }}
                    >Yes</button>
                    <button
                      style={{ ...s.carryPill, ...(!carrySet.has(task.id) ? s.carryActive : s.carryInactive) }}
                      onClick={() => { if (carrySet.has(task.id)) toggleCarry(task.id) }}
                    >No</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button style={s.cta} onClick={() => setStep('feel')}>
            Continue →
          </button>
        </div>
      </div>
    )
  }

  // ── Step 2: Feel ───────────────────────────────────────────────────────────
  if (step === 'feel') {
    return (
      <div style={s.overlay}>
        <div style={s.inner}>
          <p style={s.eyebrow}>End of day</p>
          <h1 style={s.heading}>How did today feel?</h1>

          <div style={s.feelRow}>
            {FEEL_OPTIONS.map(opt => (
              <button
                key={opt.value}
                style={{
                  ...s.feelBtn,
                  background:  feel === opt.value ? 'var(--color-accent-bg)' : 'var(--color-card)',
                  border:      feel === opt.value ? '0.5px solid var(--color-accent)' : 'var(--border)',
                  transform:   feel === opt.value ? 'scale(1.08)' : 'scale(1)',
                }}
                onClick={() => setFeel(opt.value)}
              >
                <span style={s.feelEmoji}>{opt.emoji}</span>
              </button>
            ))}
          </div>

          <button
            style={{ ...s.cta, opacity: feel ? 1 : 0.35, pointerEvents: feel ? 'auto' : 'none' }}
            onClick={enterTomorrow}
          >
            Continue →
          </button>
        </div>
      </div>
    )
  }

  // ── Step 3: Tomorrow ────────────────────────────────────────────────────────
  const list = tomorrowList || []
  return (
    <div style={s.overlay}>
      <div style={s.inner}>
        <p style={s.eyebrow}>End of day</p>
        <h1 style={s.heading}>Tomorrow's focus.</h1>

        <div style={s.taskList}>
          {list.map(task => (
            <RemoveSwipeRow key={task.id} task={task} onRemove={() => removeTask(task.id)} />
          ))}
          {list.length === 0 && (
            <p style={s.empty}>No tasks yet — add one below</p>
          )}
        </div>

        {list.length < 3 && (
          <div style={s.addRow}>
            <input
              ref={addInputRef}
              style={s.addInput}
              type="text"
              placeholder="+ Add task"
              value={addDraft}
              onChange={e => setAddDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
            />
            {addDraft.trim() && (
              <button style={s.addBtn} onClick={addTask}>↑</button>
            )}
          </div>
        )}

        <button style={s.cta} onClick={handleFinish}>
          Set tomorrow →
        </button>
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

  // Step 1 — review rows
  taskList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  reviewRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
    padding:    '12px 14px',
    background: 'var(--color-card)',
    border:     'var(--border)',
    borderRadius: 'var(--radius-sm)',
    flexWrap:   'wrap',
  },
  statusDot: {
    width:        '8px',
    height:       '8px',
    borderRadius: '50%',
    flexShrink:   0,
    transition:   'background 0.2s',
  },
  reviewText: {
    fontSize:   '14px',
    fontWeight: 500,
    flex:       1,
    minWidth:   0,
    transition: 'color 0.2s, opacity 0.2s',
  },
  carryGroup: {
    display:    'flex',
    alignItems: 'center',
    gap:        '6px',
    flexShrink: 0,
  },
  carryLabel: { fontSize: '10px', color: 'var(--color-muted)' },
  carryPill: {
    padding:      '4px 10px',
    borderRadius: 'var(--radius-pill)',
    fontSize:     '11px',
    fontWeight:   600,
    cursor:       'pointer',
    border:       'none',
    transition:   'background 0.15s, color 0.15s',
  },
  carryActive: {
    background: 'var(--color-accent)',
    color:      '#fff',
  },
  carryInactive: {
    background: 'var(--color-chart-bar)',
    color:      'var(--color-muted)',
  },

  // Step 2 — feel picker
  feelRow: {
    display:        'flex',
    justifyContent: 'space-between',
    gap:            '8px',
  },
  feelBtn: {
    flex:           1,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        '14px 0',
    borderRadius:   'var(--radius-card)',
    cursor:         'pointer',
    transition:     'background 0.15s, border-color 0.15s, transform 0.15s',
  },
  feelEmoji: { fontSize: '26px', lineHeight: 1 },

  // Step 3 — add row
  empty: { fontSize: '13px', color: 'var(--color-muted)', textAlign: 'center', padding: '12px 0' },
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
    width:          '28px',
    height:         '28px',
    borderRadius:   '50%',
    background:     'var(--color-accent)',
    border:         'none',
    color:          '#fff',
    fontSize:       '14px',
    fontWeight:     700,
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },

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
