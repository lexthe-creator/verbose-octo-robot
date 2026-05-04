import { useState, useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'
import FuelEditSheet from '../components/FuelEditSheet.jsx'
import {
  DndContext, PointerSensor, TouchSensor,
  useSensor, useSensors, closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const ENERGY_OPTIONS = [
  { value: 1, emoji: '😴', label: 'Drained' },
  { value: 2, emoji: '😐', label: 'Flat' },
  { value: 3, emoji: '🙂', label: 'Good' },
  { value: 4, emoji: '⚡', label: 'Charged' },
]

// Desktop only — touch devices use swipe gesture instead
const isHoverDevice = window.matchMedia('(hover: hover)').matches

// ─── Swipeable row ────────────────────────────────────────────────────────────
function SwipeRow({ label, sublabel, confirmed, onConfirm, onSkip }) {
  const [offset, setOffset] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const startX    = useRef(null)
  const isDragging = useRef(false)
  const THRESHOLD = 80

  function onTouchStart(e) {
    if (confirmed) return
    startX.current = e.touches[0].clientX
    setSwiping(true)
  }
  function onTouchMove(e) {
    if (confirmed || startX.current === null) return
    const delta = Math.max(0, e.touches[0].clientX - startX.current)
    setOffset(delta)
  }
  function onTouchEnd() {
    if (confirmed) return
    if (offset >= THRESHOLD) onConfirm()
    setOffset(0)
    setSwiping(false)
    startX.current = null
  }

  function onMouseDown(e) {
    if (confirmed) return
    startX.current   = e.clientX
    isDragging.current = true
    setSwiping(true)
  }
  function onMouseMove(e) {
    if (confirmed || !isDragging.current || startX.current === null) return
    const delta = Math.max(0, e.clientX - startX.current)
    setOffset(delta)
  }
  function onMouseUp() {
    if (!isDragging.current) return
    isDragging.current = false
    if (!confirmed && offset >= THRESHOLD) onConfirm()
    setOffset(0)
    setSwiping(false)
    startX.current = null
  }
  function onMouseLeave() {
    if (!isDragging.current) return
    isDragging.current = false
    setOffset(0)
    setSwiping(false)
    startX.current = null
  }

  const progress = Math.min(offset / THRESHOLD, 1)
  const bg = confirmed
    ? 'var(--color-success-bg)'
    : `rgba(29, 158, 117, ${progress * 0.25})`
  const borderColor = confirmed ? 'var(--color-success)' : `rgba(29,158,117,${progress * 0.8})`

  return (
    <div
      style={{ ...swipeStyles.wrap, background: bg, border: `0.5px solid ${borderColor}` }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      <div
        style={{
          ...swipeStyles.inner,
          transform:  `translateX(${confirmed ? 0 : offset}px)`,
          transition: swiping ? 'none' : 'transform 0.25s var(--ease-out)',
        }}
      >
        <div style={swipeStyles.text}>
          <span style={{ ...swipeStyles.label, color: confirmed ? 'var(--color-success)' : 'var(--color-text)', textDecoration: confirmed ? 'line-through' : 'none', opacity: confirmed ? 0.7 : 1 }}>
            {label}
          </span>
          {sublabel && (
            <span style={swipeStyles.sublabel}>{sublabel}</span>
          )}
        </div>

        <div style={swipeStyles.actions}>
          {/* Skip button (only when not confirmed and handler provided) */}
          {!confirmed && onSkip && (
            <button
              style={swipeStyles.skipBtn}
              onClick={e => { e.stopPropagation(); onSkip() }}
              aria-label="Skip task"
            >
              ✕
            </button>
          )}

          {/* Confirm control */}
          {isHoverDevice ? (
            confirmed ? (
              <span style={{ ...swipeStyles.checkmark, opacity: 1 }}>✓</span>
            ) : (
              <button
                style={swipeStyles.confirmBtn}
                onClick={e => { e.stopPropagation(); onConfirm() }}
                aria-label="Confirm"
              >
                ✓
              </button>
            )
          ) : (
            <span style={{ ...swipeStyles.checkmark, opacity: confirmed ? 1 : progress }}>
              {confirmed ? '✓' : '→'}
            </span>
          )}
        </div>
      </div>

      {!confirmed && !isHoverDevice && (
        <div style={{ ...swipeStyles.hint, opacity: offset === 0 ? 0.35 : 0 }}>
          swipe →
        </div>
      )}
    </div>
  )
}

const swipeStyles = {
  wrap: {
    borderRadius:   'var(--radius-sm)',
    overflow:       'hidden',
    position:       'relative',
    userSelect:     'none',
    touchAction:    'pan-y',
  },
  inner: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '14px 16px',
    gap:            '8px',
  },
  text: {
    display:        'flex',
    flexDirection:  'column',
    gap:            '2px',
    flex:           1,
  },
  label: {
    fontSize:    '15px',
    fontWeight:  500,
  },
  sublabel: {
    fontSize:    '12px',
    color:       'var(--color-muted)',
  },
  actions: {
    display:    'flex',
    alignItems: 'center',
    gap:        '8px',
    flexShrink: 0,
  },
  skipBtn: {
    width:          '22px',
    height:         '22px',
    borderRadius:   '50%',
    background:     'var(--color-faint)',
    border:         'none',
    color:          'var(--color-muted)',
    fontSize:       '11px',
    fontWeight:     700,
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    lineHeight:     1,
    flexShrink:     0,
  },
  checkmark: {
    fontSize:   '18px',
    color:      'var(--color-success)',
    fontWeight: 600,
    flexShrink: 0,
    transition: 'opacity 0.15s',
  },
  confirmBtn: {
    width:           '28px',
    height:          '28px',
    borderRadius:    '50%',
    background:      'var(--color-accent)',
    border:          'none',
    color:           '#fff',
    fontSize:        '14px',
    fontWeight:      600,
    cursor:          'pointer',
    flexShrink:      0,
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    transition:      'opacity 0.15s',
  },
  hint: {
    position:      'absolute',
    right:         '16px',
    top:           '50%',
    transform:     'translateY(-50%)',
    fontSize:      '11px',
    color:         'var(--color-muted)',
    transition:    'opacity 0.3s',
    pointerEvents: 'none',
  },
}

// ─── Meal tap slot ────────────────────────────────────────────────────────────

function fmt24(hhmm) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function MealSlot({ label, startTime, endTime, confirmed, onConfirm, onEditTime }) {
  return (
    <div style={{
      ...mealStyles.slot,
      background: confirmed ? 'var(--color-success-bg)' : 'var(--color-card)',
      border:     confirmed ? '0.5px solid var(--color-success)' : 'var(--border)',
    }}>
      {/* Tap main area to confirm */}
      <button
        style={mealStyles.mainBtn}
        onClick={!confirmed ? onConfirm : undefined}
        disabled={confirmed}
      >
        <span style={{ ...mealStyles.label, color: confirmed ? 'var(--color-success)' : 'var(--color-text)' }}>
          {confirmed ? '✓ ' : ''}{label}
        </span>
      </button>

      {/* Time text — tap to edit */}
      {!confirmed ? (
        <button style={mealStyles.timeBtn} onClick={onEditTime}>
          {fmt24(startTime)} – {fmt24(endTime)}
        </button>
      ) : (
        <span style={mealStyles.timeConfirmed}>{fmt24(startTime)} – {fmt24(endTime)}</span>
      )}
    </div>
  )
}

const mealStyles = {
  slot: {
    display:        'flex',
    flexDirection:  'column',
    borderRadius:   'var(--radius-sm)',
    overflow:       'hidden',
    transition:     'background 0.2s, border-color 0.2s',
  },
  mainBtn: {
    display:        'flex',
    alignItems:     'flex-start',
    padding:        '12px 14px 6px',
    background:     'none',
    border:         'none',
    cursor:         'pointer',
    textAlign:      'left',
    width:          '100%',
  },
  label: {
    fontSize:   '14px',
    fontWeight: 600,
  },
  timeBtn: {
    padding:        '0 14px 10px',
    background:     'none',
    border:         'none',
    cursor:         'pointer',
    fontSize:       '11px',
    color:          'var(--color-accent)',
    fontWeight:     500,
    textAlign:      'left',
    textDecoration: 'underline',
    textDecorationColor: 'var(--color-accent)',
    fontFamily:     'var(--font-body)',
  },
  timeConfirmed: {
    padding:   '0 14px 10px',
    display:   'block',
    fontSize:  '11px',
    color:     'var(--color-muted)',
  },
}

// ─── Add task row (inline input) ──────────────────────────────────────────────

function DraftTaskRow({ draft, onUpdate, onCommit, onCancel }) {
  return (
    <div style={dt.wrap}>
      <input
        autoFocus
        type="text"
        style={dt.input}
        value={draft.text}
        onChange={e => onUpdate(draft.id, e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') onCommit(draft.id)
          if (e.key === 'Escape') onCancel(draft.id)
        }}
        placeholder="Task name..."
      />
      <button
        style={{ ...dt.btn, ...dt.confirmBtn, opacity: draft.text.trim() ? 1 : 0.4 }}
        onClick={() => onCommit(draft.id)}
        disabled={!draft.text.trim()}
        aria-label="Add task"
      >
        ✓
      </button>
      <button
        style={{ ...dt.btn, ...dt.cancelBtn }}
        onClick={() => onCancel(draft.id)}
        aria-label="Cancel"
      >
        ✕
      </button>
    </div>
  )
}

const dt = {
  wrap: {
    display:      'flex',
    alignItems:   'center',
    gap:          '8px',
    background:   'var(--color-card)',
    border:       'var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding:      '10px 12px',
  },
  input: {
    flex:       1,
    fontSize:   '15px',
    color:      'var(--color-text)',
    background: 'none',
    border:     'none',
    outline:    'none',
    fontFamily: 'var(--font-body)',
  },
  btn: {
    width:          '24px',
    height:         '24px',
    borderRadius:   '50%',
    border:         'none',
    fontSize:       '12px',
    fontWeight:     700,
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
    lineHeight:     1,
    transition:     'opacity 0.15s',
  },
  confirmBtn: {
    background: 'var(--color-accent)',
    color:      '#fff',
  },
  cancelBtn: {
    background: 'var(--color-faint)',
    color:      'var(--color-muted)',
  },
}

// ─── Sortable task row ────────────────────────────────────────────────────────
function SortableTaskRow({ task, confirmed, onConfirm, onSkip }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(task.id),
    disabled: confirmed,
  })
  const baseTransform = CSS.Transform.toString(transform) ?? ''
  const scaleSuffix   = isDragging ? ' scale(1.02)' : ''
  const outerStyle = {
    display:    'flex',
    alignItems: 'stretch',
    transform:  (baseTransform + scaleSuffix) || undefined,
    transition: isDragging ? undefined : transition,
    opacity:    isDragging ? 0.9 : 1,
    boxShadow:  isDragging ? '0 8px 24px rgba(0,0,0,0.5)' : undefined,
    zIndex:     isDragging ? 100 : undefined,
    position:   'relative',
  }
  return (
    <div ref={setNodeRef} style={outerStyle}>
      <div
        {...(!confirmed ? listeners   : {})}
        {...(!confirmed ? attributes  : {})}
        style={{
          width:          '20px',
          flexShrink:     0,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          cursor:         confirmed ? 'default' : 'grab',
          touchAction:    'none',
          color:          'var(--color-faint)',
          fontSize:       '14px',
          userSelect:     'none',
          opacity:        confirmed ? 0 : 0.4,
        }}
      >
        ⠿
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <SwipeRow
          label={task.text}
          sublabel={task._new ? '' : task.dueTime}
          confirmed={confirmed}
          onConfirm={onConfirm}
          onSkip={!confirmed ? onSkip : undefined}
        />
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MorningIgnition({ onComplete }) {
  const { state, dispatch } = useApp()
  const [step, setStep] = useState('energy')

  // Local brief state
  const [localEnergy,  setLocalEnergy]  = useState(state.energyLevel)
  const [localTasks,   setLocalTasks]   = useState([])  // confirmed task ids
  const [localMeals,   setLocalMeals]   = useState([])  // confirmed meal slots
  const [localWorkout, setLocalWorkout] = useState(false)

  // Task management in brief
  const [briefTasks, setBriefTasks]       = useState(
    () => state.tasks.map(t => ({ ...t, _new: false }))
  )
  const [exitingTaskId, setExitingTaskId] = useState(null)
  const [draftTasks,    setDraftTasks]    = useState([])  // pending inline inputs

  // Meal window editing
  const [mealWindows, setMealWindows] = useState(() => {
    const w = {}
    Object.entries(state.meals).forEach(([slot, meal]) => {
      w[slot] = { startTime: meal.startTime, endTime: meal.endTime }
    })
    return w
  })
  const [editingMealSlot, setEditingMealSlot] = useState(null)

  // Drag-to-reorder
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setBriefTasks(prev => {
      const oldIndex = prev.findIndex(t => String(t.id) === active.id)
      const newIndex = prev.findIndex(t => String(t.id) === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  // Dynamic totals
  const activeTasks   = briefTasks.filter(t => t.id !== exitingTaskId)
  const TOTAL_ITEMS   = activeTasks.length + 1 + 4  // tasks + workout + meals
  const confirmedCount = (
    localTasks.filter(id => activeTasks.some(t => t.id === id)).length +
    localMeals.length +
    (localWorkout ? 1 : 0)
  )
  const progress     = TOTAL_ITEMS > 0 ? confirmedCount / TOTAL_ITEMS : 0
  const allConfirmed = confirmedCount === TOTAL_ITEMS && draftTasks.length === 0

  const today     = new Date()
  const dayLabel  = today.toLocaleDateString('en-US', { weekday: 'long' })
  const dateLabel = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  function confirmTask(id) {
    if (!localTasks.includes(id)) setLocalTasks(prev => [...prev, id])
  }

  function confirmMeal(slot) {
    if (!localMeals.includes(slot)) setLocalMeals(prev => [...prev, slot])
  }

  function skipTask(id) {
    setLocalTasks(prev => prev.filter(tid => tid !== id))
    setExitingTaskId(id)
    setTimeout(() => {
      setBriefTasks(prev => prev.filter(t => t.id !== id))
      setExitingTaskId(null)
    }, 200)
  }

  function addDraftTask() {
    setDraftTasks(prev => [...prev, { id: `draft_${Date.now()}`, text: '' }])
  }

  function updateDraftText(id, text) {
    setDraftTasks(prev => prev.map(d => d.id === id ? { ...d, text } : d))
  }

  function commitDraft(id) {
    const draft = draftTasks.find(d => d.id === id)
    if (!draft?.text.trim()) {
      setDraftTasks(prev => prev.filter(d => d.id !== id))
      return
    }
    const newTask = {
      id:    id,
      text:  draft.text.trim(),
      _new:  true,
      done:  false,
      dueTime:       null,
      scheduledTime: null,
    }
    setBriefTasks(prev => [...prev, newTask])
    setDraftTasks(prev => prev.filter(d => d.id !== id))
  }

  function cancelDraft(id) {
    setDraftTasks(prev => prev.filter(d => d.id !== id))
  }

  function handleLockDay() {
    dispatch({ type: 'SET_ENERGY', payload: localEnergy })

    // Confirm original tasks
    activeTasks
      .filter(t => !t._new && localTasks.includes(t.id))
      .forEach(t => dispatch({ type: 'CONFIRM_TASK', payload: t.id }))

    // Add + confirm new tasks
    activeTasks
      .filter(t => t._new && localTasks.includes(t.id))
      .forEach(t => dispatch({ type: 'ADD_TASK', payload: { text: t.text } }))

    // Persist drag-reorder priority for original tasks
    const orderedIds = activeTasks.filter(t => !t._new).map(t => t.id)
    dispatch({ type: 'REORDER_TASKS', payload: { orderedIds } })

    // Meals with local window overrides
    localMeals.forEach(slot => dispatch({
      type: 'CONFIRM_MEAL',
      payload: { slot, ...mealWindows[slot] },
    }))

    if (localWorkout) dispatch({ type: 'CONFIRM_WORKOUT' })
    dispatch({ type: 'LOCK_DAY' })
    setStep('locked')
  }

  // ── Step 1: Energy ──────────────────────────────────────────────────────────
  if (step === 'energy') {
    return (
      <div style={s.energyScreen}>
        <div style={s.energyInner}>
          <p style={s.energySubtitle}>Good morning</p>
          <h1 style={s.energyHeading}>How are you<br />showing up today?</h1>

          <div style={s.emojiGrid}>
            {ENERGY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                style={{
                  ...s.emojiBtn,
                  background:   localEnergy === opt.value ? 'var(--color-accent-bg)' : 'var(--color-card)',
                  border:       localEnergy === opt.value ? '0.5px solid var(--color-accent)' : 'var(--border)',
                }}
                onClick={() => setLocalEnergy(opt.value)}
              >
                <span style={s.emoji}>{opt.emoji}</span>
                <span style={{ ...s.emojiLabel, color: localEnergy === opt.value ? 'var(--color-accent)' : 'var(--color-muted)' }}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>

          <button
            style={{
              ...s.cta,
              opacity:       localEnergy ? 1 : 0.35,
              pointerEvents: localEnergy ? 'auto' : 'none',
            }}
            onClick={() => setStep('brief')}
          >
            See my brief →
          </button>
        </div>
      </div>
    )
  }

  // ── Step 2: Brief ───────────────────────────────────────────────────────────
  if (step === 'brief') {
    return (
      <div style={s.briefScreen}>
        {/* Header */}
        <div style={s.briefHeader}>
          <p style={s.briefDay}>{dayLabel}</p>
          <h1 style={s.briefDate}>{dateLabel}</h1>
        </div>

        {/* Progress bar */}
        <div style={s.progressTrack}>
          <div style={{ ...s.progressFill, width: `${progress * 100}%` }} />
        </div>
        <p style={s.progressLabel}>{confirmedCount} of {TOTAL_ITEMS} confirmed</p>

        {/* 3 Things */}
        <section style={s.section}>
          <p style={s.sectionLabel}>3 Things</p>
          <div style={s.stack}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={activeTasks.map(t => String(t.id))} strategy={verticalListSortingStrategy}>
                {activeTasks.map(task => (
                  <SortableTaskRow
                    key={task.id}
                    task={task}
                    confirmed={localTasks.includes(task.id)}
                    onConfirm={() => confirmTask(task.id)}
                    onSkip={!localTasks.includes(task.id) ? () => skipTask(task.id) : undefined}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {/* Pending draft inputs */}
            {draftTasks.map(draft => (
              <DraftTaskRow
                key={draft.id}
                draft={draft}
                onUpdate={updateDraftText}
                onCommit={commitDraft}
                onCancel={cancelDraft}
              />
            ))}

            {/* Add task button */}
            <button style={s.addTaskBtn} onClick={addDraftTask}>
              + Add task
            </button>
          </div>
        </section>

        {/* Training */}
        <section style={s.section}>
          <p style={s.sectionLabel}>Training</p>
          <SwipeRow
            label={state.workout.type}
            sublabel={`${state.workout.duration} · ${state.workout.pace} · ${state.workout.time}`}
            confirmed={localWorkout}
            onConfirm={() => setLocalWorkout(true)}
          />
        </section>

        {/* Meals */}
        <section style={s.section}>
          <div style={s.labelGroup}>
            <p style={s.sectionLabel}>Set today's meal reminders</p>
            <p style={s.sectionHelper}>
              Tap each window to confirm — tap the time to adjust it.
            </p>
          </div>
          <div style={s.mealGrid}>
            {Object.entries(state.meals).map(([slot, meal]) => (
              <MealSlot
                key={slot}
                label={meal.label}
                startTime={mealWindows[slot]?.startTime ?? meal.startTime}
                endTime={mealWindows[slot]?.endTime ?? meal.endTime}
                confirmed={localMeals.includes(slot)}
                onConfirm={() => confirmMeal(slot)}
                onEditTime={() => setEditingMealSlot(slot)}
              />
            ))}
          </div>
        </section>

        {/* Lock button */}
        <div style={s.lockWrap}>
          <button
            style={{
              ...s.cta,
              opacity:       allConfirmed ? 1 : 0.35,
              pointerEvents: allConfirmed ? 'auto' : 'none',
            }}
            onClick={handleLockDay}
          >
            Lock in my day
          </button>
        </div>

        {/* FuelEditSheet for meal time editing */}
        {editingMealSlot && (
          <FuelEditSheet
            meal={{
              label:     state.meals[editingMealSlot].label,
              startTime: mealWindows[editingMealSlot]?.startTime ?? state.meals[editingMealSlot].startTime,
              endTime:   mealWindows[editingMealSlot]?.endTime   ?? state.meals[editingMealSlot].endTime,
            }}
            onClose={() => setEditingMealSlot(null)}
            onSave={(start, end) => {
              setMealWindows(prev => ({ ...prev, [editingMealSlot]: { startTime: start, endTime: end } }))
              setEditingMealSlot(null)
            }}
          />
        )}
      </div>
    )
  }

  // ── Step 3: Locked ──────────────────────────────────────────────────────────
  const confirmedTaskTexts = activeTasks
    .filter(t => localTasks.includes(t.id))
    .map(t => t.text)

  const lockedItems = [
    ...confirmedTaskTexts,
    `${state.workout.type} — ${state.workout.duration}`,
    ...localMeals.map(slot => state.meals[slot]?.label ?? slot),
  ]

  return (
    <div style={s.lockedScreen}>
      <div style={s.lockedInner}>
        <span style={s.lockedGlyph}>✦</span>
        <h1 style={s.lockedTitle}>Day locked in.</h1>
        <p style={s.lockedSub}>{dayLabel}, {dateLabel}</p>

        <div style={s.chipWrap}>
          {lockedItems.map((item, i) => (
            <span key={i} style={s.chip}>{item}</span>
          ))}
        </div>

        <button style={s.cta} onClick={onComplete}>
          Go to home →
        </button>
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  // Energy screen
  energyScreen: {
    minHeight:      '100dvh',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        'var(--space-6)',
    paddingTop:     'calc(var(--safe-top) + var(--space-12))',
    paddingBottom:  'calc(var(--safe-bottom) + var(--space-8))',
    background:     'var(--color-bg)',
  },
  energyInner: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            'var(--space-8)',
    width:          '100%',
    maxWidth:       '340px',
  },
  energySubtitle: {
    fontSize:      '13px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color:         'var(--color-muted)',
  },
  energyHeading: {
    fontFamily:  'var(--font-display)',
    fontSize:    '32px',
    lineHeight:  1.2,
    textAlign:   'center',
    color:       'var(--color-text)',
  },
  emojiGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap:                 'var(--space-3)',
    width:               '100%',
  },
  emojiBtn: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            'var(--space-2)',
    padding:        'var(--space-5) var(--space-4)',
    borderRadius:   'var(--radius-card)',
    cursor:         'pointer',
    transition:     'background 0.15s, border-color 0.15s',
  },
  emoji: {
    fontSize:   '32px',
    lineHeight: 1,
  },
  emojiLabel: {
    fontSize:   '13px',
    fontWeight: 500,
    transition: 'color 0.15s',
  },

  // Brief screen
  briefScreen: {
    minHeight:     '100dvh',
    padding:       'var(--space-6)',
    paddingTop:    'calc(var(--safe-top) + var(--space-8))',
    paddingBottom: 'calc(var(--safe-bottom) + var(--space-12))',
    display:       'flex',
    flexDirection: 'column',
    gap:           'var(--space-6)',
    background:    'var(--color-bg)',
  },
  briefHeader: {
    display:       'flex',
    flexDirection: 'column',
    gap:           'var(--space-1)',
  },
  briefDay: {
    fontSize:      '12px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color:         'var(--color-muted)',
  },
  briefDate: {
    fontFamily: 'var(--font-display)',
    fontSize:   '28px',
    color:      'var(--color-text)',
  },
  progressTrack: {
    height:       '2px',
    background:   'var(--color-faint)',
    borderRadius: 'var(--radius-pill)',
    overflow:     'hidden',
  },
  progressFill: {
    height:       '100%',
    background:   'var(--color-success)',
    borderRadius: 'var(--radius-pill)',
    transition:   'width 0.4s var(--ease-out)',
  },
  progressLabel: {
    fontSize:   '11px',
    color:      'var(--color-muted)',
    marginTop:  '-12px',
    textAlign:  'right',
  },
  section: {
    display:       'flex',
    flexDirection: 'column',
    gap:           'var(--space-3)',
  },
  sectionLabel: {
    fontSize:      '11px',
    fontWeight:    600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color:         'var(--color-muted)',
  },
  labelGroup: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '4px',
  },
  sectionHelper: {
    fontSize:   '11px',
    color:      'var(--color-faint)',
    lineHeight: 1.4,
  },
  stack: {
    display:       'flex',
    flexDirection: 'column',
    gap:           'var(--space-2)',
  },
  addTaskBtn: {
    alignSelf:   'flex-start',
    background:  'none',
    border:      'none',
    color:       'var(--color-faint)',
    fontSize:    '11px',
    fontWeight:  500,
    cursor:      'pointer',
    padding:     '2px 0',
  },
  mealGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap:                 'var(--space-2)',
  },
  lockWrap: {
    paddingTop: 'var(--space-4)',
  },

  // Locked screen
  lockedScreen: {
    minHeight:      '100dvh',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        'var(--space-6)',
    paddingTop:     'calc(var(--safe-top) + var(--space-8))',
    paddingBottom:  'calc(var(--safe-bottom) + var(--space-8))',
    background:     'var(--color-bg)',
  },
  lockedInner: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            'var(--space-6)',
    width:          '100%',
    maxWidth:       '340px',
  },
  lockedGlyph: {
    fontSize:   '36px',
    color:      'var(--color-accent)',
    lineHeight: 1,
  },
  lockedTitle: {
    fontFamily:  'var(--font-display)',
    fontSize:    '36px',
    color:       'var(--color-text)',
    textAlign:   'center',
    marginTop:   '-16px',
  },
  lockedSub: {
    fontSize:    '13px',
    color:       'var(--color-muted)',
    marginTop:   '-16px',
  },
  chipWrap: {
    display:        'flex',
    flexWrap:       'wrap',
    gap:            'var(--space-2)',
    justifyContent: 'center',
  },
  chip: {
    display:       'inline-block',
    padding:       '6px 12px',
    borderRadius:  'var(--radius-pill)',
    background:    'var(--color-success-bg)',
    border:        '0.5px solid var(--color-success)',
    color:         'var(--color-success)',
    fontSize:      '13px',
    fontWeight:    500,
  },

  // Shared CTA button
  cta: {
    width:         '100%',
    padding:       '16px',
    borderRadius:  'var(--radius-card)',
    background:    'var(--color-accent)',
    color:         '#fff',
    fontSize:      '16px',
    fontWeight:    600,
    textAlign:     'center',
    cursor:        'pointer',
    border:        'none',
    transition:    'opacity 0.2s',
    letterSpacing: '0.01em',
  },
}
