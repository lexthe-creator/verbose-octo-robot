import { useState, useRef } from 'react'
import { useInbox } from '../context/index.js'

/* ─── Formatting helpers ─────────────────────────────────────────────────── */

function formatTimestamp(iso) {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  if (mins  <  1) return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatCalendarDateTime(date, time) {
  if (!date) return ''
  const d = new Date(date + 'T00:00:00')
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  if (!time) return dateStr
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour   = h % 12 || 12
  return `${dateStr} · ${hour}:${m.toString().padStart(2, '0')} ${period}`
}

/* ─── SwipeDeleteRow ─────────────────────────────────────────────────────── */
// Reveals a red delete zone on left swipe (72px threshold).
// Tap the zone to confirm delete; swipe past 180px to auto-delete.

function SwipeDeleteRow({ onDelete, children }) {
  const [offset,    setOffset]    = useState(0)
  const [swiping,   setSwiping]   = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const startX     = useRef(null)
  const isDragging = useRef(false)

  const REVEAL_THRESHOLD  = 72
  const AUTO_DELETE_THRESHOLD = 180

  function commitDelete() {
    setDeleting(true)
    setTimeout(onDelete, 200)
  }

  function handleTouchStart(e) {
    startX.current = e.touches[0].clientX
    setSwiping(true)
  }
  function handleTouchMove(e) {
    if (startX.current === null) return
    const delta = Math.min(0, e.touches[0].clientX - startX.current)
    setOffset(delta)
    if (delta < -AUTO_DELETE_THRESHOLD) commitDelete()
  }
  function handleTouchEnd() {
    if (offset < -REVEAL_THRESHOLD) {
      setOffset(-REVEAL_THRESHOLD)
    } else {
      setOffset(0)
    }
    setSwiping(false)
    startX.current = null
  }

  function handleMouseDown(e) {
    startX.current   = e.clientX
    isDragging.current = true
    setSwiping(true)
  }
  function handleMouseMove(e) {
    if (!isDragging.current || startX.current === null) return
    const delta = Math.min(0, e.clientX - startX.current)
    setOffset(delta)
    if (delta < -AUTO_DELETE_THRESHOLD) commitDelete()
  }
  function handleMouseUp() {
    if (!isDragging.current) return
    isDragging.current = false
    if (offset < -REVEAL_THRESHOLD) {
      setOffset(-REVEAL_THRESHOLD)
    } else {
      setOffset(0)
    }
    setSwiping(false)
    startX.current = null
  }
  function handleMouseLeave() {
    if (!isDragging.current) return
    isDragging.current = false
    setOffset(0)
    setSwiping(false)
    startX.current = null
  }

  const isRevealed = offset <= -REVEAL_THRESHOLD

  return (
    <div
      style={{
        position:   'relative',
        overflow:   'hidden',
        borderRadius: 'var(--radius-card)',
        opacity:    deleting ? 0 : 1,
        transform:  deleting ? 'translateX(-40px)' : 'none',
        transition: deleting ? 'opacity 200ms ease, transform 200ms ease' : undefined,
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Red delete zone (behind) */}
      <div style={{
        position:       'absolute',
        right:          0,
        top:            0,
        bottom:         0,
        width:          '72px',
        background:     'var(--color-danger)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        cursor:         'pointer',
        borderRadius:   'var(--radius-card)',
      }}
        onClick={isRevealed ? commitDelete : undefined}
      >
        <span style={{ fontSize: '12px', color: '#fff', fontWeight: 600 }}>Delete</span>
      </div>

      {/* Sliding content */}
      <div
        style={{
          transform:  `translateX(${offset}px)`,
          transition: swiping ? 'none' : 'transform 0.25s var(--ease-out)',
          userSelect: 'none',
          touchAction: 'pan-y',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {children}
      </div>
    </div>
  )
}

/* ─── CollapsibleSection ─────────────────────────────────────────────────── */

function CollapsibleSection({ title, count, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={s.triageSection}>
      <button style={s.sectionHeader} onClick={() => setOpen(o => !o)}>
        <div style={s.sectionHeaderLeft}>
          <span style={s.sectionTitle}>{title}</span>
          {count > 0 && <span style={s.sectionBadge}>{count}</span>}
        </div>
        <span style={{ ...s.chevron, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▾
        </span>
      </button>

      <div style={{
        maxHeight:  open ? '2000px' : '0',
        overflow:   'hidden',
        transition: 'max-height 300ms ease',
      }}>
        <div style={s.sectionBody}>
          {children}
        </div>
      </div>
    </div>
  )
}

/* ─── TaskPoolRow ────────────────────────────────────────────────────────── */

function TaskPoolRow({ task, onDelete }) {
  return (
    <SwipeDeleteRow onDelete={onDelete}>
      <div style={s.triageRow}>
        <span style={s.triageRowText}>{task.text}</span>
        <span style={s.queueBadge}>Queue</span>
      </div>
    </SwipeDeleteRow>
  )
}

/* ─── CalendarRow ────────────────────────────────────────────────────────── */

function CalendarRow({ item, onConfirm, onDelete }) {
  // Unconfirmed items start in edit mode; confirmed start collapsed
  const [editing, setEditing] = useState(!item.confirmed)
  const [date, setDate] = useState(item.date ?? '')
  const [time, setTime] = useState(item.time ?? '')

  function handleConfirm() {
    if (!date) return
    onConfirm(item.id, date, time || null)
    setEditing(false)
  }

  return (
    <SwipeDeleteRow onDelete={onDelete}>
      <div style={s.calendarRow}>
        <div style={s.triageRowText}>{item.text}</div>

        {editing ? (
          <div style={s.calendarPickers}>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={s.dateInput}
            />
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              style={s.dateInput}
            />
            <button
              style={{
                ...s.confirmCalBtn,
                opacity: date ? 1 : 0.35,
                pointerEvents: date ? 'auto' : 'none',
              }}
              onClick={handleConfirm}
            >
              Confirm
            </button>
          </div>
        ) : (
          <button style={s.calendarConfirmed} onClick={() => setEditing(true)}>
            {formatCalendarDateTime(item.date, item.time)}
          </button>
        )}
      </div>
    </SwipeDeleteRow>
  )
}

/* ─── NoteRow ────────────────────────────────────────────────────────────── */

function NoteRow({ note, onPin, onDelete }) {
  const longPressTimer = useRef(null)

  function startLongPress() {
    longPressTimer.current = setTimeout(() => onPin(note.id), 400)
  }
  function cancelLongPress() {
    clearTimeout(longPressTimer.current)
  }

  return (
    <SwipeDeleteRow onDelete={onDelete}>
      <div
        style={s.noteRow}
        onTouchStart={startLongPress}
        onTouchEnd={cancelLongPress}
        onTouchMove={cancelLongPress}
        onMouseDown={startLongPress}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
      >
        <div style={s.noteLeft}>
          {note.pinned && <span style={s.pinIndicator}>●</span>}
          <span style={s.triageRowText}>{note.text}</span>
        </div>
        <span style={s.noteTimestamp}>{formatTimestamp(note.createdAt)}</span>
      </div>
    </SwipeDeleteRow>
  )
}

/* ─── InboxItemRow (raw capture) ─────────────────────────────────────────── */

function InboxItemRow({ item, exiting, flashing, onAction }) {
  if (flashing) {
    return (
      <div style={s.flashWrap}>
        <span style={s.flashText}>{flashing}</span>
      </div>
    )
  }

  return (
    <div style={{
      ...s.inboxItemWrap,
      opacity:   exiting ? 0 : 1,
      transform: exiting ? 'translateX(-40px)' : 'translateX(0)',
      transition: 'opacity 200ms ease, transform 200ms ease',
    }}>
      <div style={s.inboxItemRow}>
        <span style={s.dot} />
        <span style={s.inboxItemText}>{item.text}</span>
        <span style={s.timestamp}>{formatTimestamp(item.createdAt)}</span>
      </div>
      <div style={s.actions}>
        <button style={s.actionBtn} onClick={() => onAction(item.id, item.text, 'task')}>
          → Task
        </button>
        <button style={s.actionBtn} onClick={() => onAction(item.id, item.text, 'calendar')}>
          → Calendar
        </button>
        <button style={s.actionBtn} onClick={() => onAction(item.id, item.text, 'note')}>
          → Note
        </button>
        <button
          style={{ ...s.actionBtn, color: 'var(--color-danger)' }}
          onClick={() => onAction(item.id, item.text, 'delete')}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

/* ─── Screen ─────────────────────────────────────────────────────────────── */

export default function Inbox() {
  const { inboxState, inboxDispatch } = useInbox()
  const [inputText,  setInputText]  = useState('')
  const [exitingId,  setExitingId]  = useState(null)
  const [flashingId, setFlashingId] = useState(null)
  const [flashMsg,   setFlashMsg]   = useState('')
  const inputRef = useRef(null)

  function handleSubmit() {
    const text = inputText.trim()
    if (!text) return
    inboxDispatch({ type: 'ADD_INBOX_ITEM', payload: { text } })
    setInputText('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSubmit()
  }

  function animateExit(itemId, afterMs, then) {
    setExitingId(itemId)
    setTimeout(() => {
      then()
      setExitingId(null)
    }, afterMs)
  }

  function handleAction(itemId, itemText, action) {
    if (exitingId || flashingId) return

    if (action === 'task') {
      setFlashingId(itemId)
      setFlashMsg('Added to queue ✓')
      setTimeout(() => {
        setFlashingId(null)
        setFlashMsg('')
        animateExit(itemId, 200, () =>
          inboxDispatch({ type: 'TRIAGE_TO_TASK', payload: { id: itemId, text: itemText } })
        )
      }, 600)
      return
    }

    if (action === 'calendar') {
      animateExit(itemId, 200, () =>
        inboxDispatch({ type: 'TRIAGE_TO_CALENDAR', payload: { id: itemId, text: itemText } })
      )
      return
    }

    if (action === 'note') {
      setFlashingId(itemId)
      setFlashMsg('Saved to notes ✓')
      setTimeout(() => {
        setFlashingId(null)
        setFlashMsg('')
        animateExit(itemId, 200, () =>
          inboxDispatch({ type: 'TRIAGE_TO_NOTE', payload: { id: itemId, text: itemText } })
        )
      }, 600)
      return
    }

    // delete
    animateExit(itemId, 200, () =>
      inboxDispatch({ type: 'REMOVE_INBOX_ITEM', payload: { id: itemId } })
    )
  }

  // Sort notes: pinned first
  const sortedNotes = [...inboxState.notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return 0
  })

  const totalItems = inboxState.inboxItems.length
    + inboxState.taskPool.length
    + inboxState.calendarItems.length
    + inboxState.notes.length

  return (
    <div style={s.screen}>
      <style>{`
        .inbox-input::placeholder { color: var(--color-faint); }
        .inbox-date-input { color-scheme: dark; }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={s.header}>
        <div style={s.headerRow}>
          <h1 style={s.title}>Inbox</h1>
          {totalItems > 0 && (
            <span style={s.badge}>{totalItems}</span>
          )}
        </div>
        <p style={s.subtitle}>Capture anything. Sort later.</p>
      </div>

      {/* ── Capture bar ─────────────────────────────────────────────────── */}
      <div style={s.captureBar}>
        <input
          ref={inputRef}
          className="inbox-input"
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add something..."
          style={s.captureInput}
        />
        <button
          style={{
            ...s.sendBtn,
            opacity:       inputText.trim() ? 1 : 0.35,
            pointerEvents: inputText.trim() ? 'auto' : 'none',
          }}
          onClick={handleSubmit}
          aria-label="Add item"
        >
          ↑
        </button>
      </div>

      {/* ── Scrollable triage area ───────────────────────────────────────── */}
      <div style={s.triageArea}>

        {/* Raw inbox items */}
        {inboxState.inboxItems.length > 0 && (
          <div style={s.inboxList}>
            {inboxState.inboxItems.map(item => (
              <InboxItemRow
                key={item.id}
                item={item}
                exiting={exitingId === item.id}
                flashing={flashingId === item.id ? flashMsg : null}
                onAction={handleAction}
              />
            ))}
          </div>
        )}

        {inboxState.inboxItems.length === 0 && totalItems === 0 && (
          <div style={s.empty}>
            <span style={s.emptyIcon}>◎</span>
            <p style={s.emptyText}>Clear mind. Add something above.</p>
          </div>
        )}

        {/* ── TASKS section ─────────────────────────────────────────────── */}
        <CollapsibleSection
          title="Tasks"
          count={inboxState.taskPool.length}
          defaultOpen={inboxState.taskPool.length > 0}
        >
          {inboxState.taskPool.length === 0 ? (
            <p style={s.emptySection}>No tasks queued. Triage items from your inbox above.</p>
          ) : (
            <div style={s.sectionStack}>
              {inboxState.taskPool.map(task => (
                <TaskPoolRow
                  key={task.id}
                  task={task}
                  onDelete={() =>
                    inboxDispatch({ type: 'DELETE_POOL_TASK', payload: { id: task.id } })
                  }
                />
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* ── CALENDAR section ──────────────────────────────────────────── */}
        <CollapsibleSection
          title="Calendar"
          count={inboxState.calendarItems.length}
          defaultOpen={inboxState.calendarItems.length > 0}
        >
          {inboxState.calendarItems.length === 0 ? (
            <p style={s.emptySection}>No calendar items. Triage items from your inbox above.</p>
          ) : (
            <div style={s.sectionStack}>
              {inboxState.calendarItems.map(item => (
                <CalendarRow
                  key={item.id}
                  item={item}
                  onConfirm={(id, date, time) =>
                    inboxDispatch({ type: 'UPDATE_CALENDAR_ITEM', payload: { id, date, time } })
                  }
                  onDelete={() =>
                    inboxDispatch({ type: 'DELETE_CALENDAR_ITEM', payload: { id: item.id } })
                  }
                />
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* ── NOTES section ─────────────────────────────────────────────── */}
        <CollapsibleSection
          title="Notes"
          count={inboxState.notes.length}
          defaultOpen={inboxState.notes.length > 0}
        >
          {inboxState.notes.length === 0 ? (
            <p style={s.emptySection}>No notes saved.</p>
          ) : (
            <div style={s.sectionStack}>
              {sortedNotes.map(note => (
                <NoteRow
                  key={note.id}
                  note={note}
                  onPin={id =>
                    inboxDispatch({ type: 'PIN_NOTE', payload: { id } })
                  }
                  onDelete={() =>
                    inboxDispatch({ type: 'DELETE_NOTE', payload: { id: note.id } })
                  }
                />
              ))}
            </div>
          )}
        </CollapsibleSection>

      </div>
    </div>
  )
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const s = {
  screen: {
    display:       'flex',
    flexDirection: 'column',
    minHeight:     '100dvh',
    paddingTop:    'calc(var(--safe-top) + var(--space-8))',
    paddingBottom: 'calc(var(--safe-bottom) + var(--nav-height) + var(--space-6))',
    background:    'var(--color-bg)',
  },

  // Header
  header: {
    padding:       '0 20px var(--space-5)',
    display:       'flex',
    flexDirection: 'column',
    gap:           'var(--space-1)',
  },
  headerRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        'var(--space-3)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize:   '32px',
    color:      'var(--color-text)',
    lineHeight: 1,
  },
  badge: {
    padding:      '3px 9px',
    borderRadius: 'var(--radius-pill)',
    background:   'var(--color-accent-bg)',
    color:        'var(--color-accent)',
    fontSize:     '13px',
    fontWeight:   600,
  },
  subtitle: {
    fontSize: '13px',
    color:    'var(--color-muted)',
  },

  // Capture bar
  captureBar: {
    display:      'flex',
    alignItems:   'center',
    gap:          'var(--space-2)',
    margin:       '0 20px var(--space-5)',
    background:   'var(--color-card)',
    border:       'var(--border)',
    borderRadius: 'var(--radius-card)',
    padding:      '4px 4px 4px 16px',
  },
  captureInput: {
    flex:       1,
    fontSize:   '15px',
    color:      'var(--color-text)',
    background: 'none',
    border:     'none',
    outline:    'none',
    padding:    '10px 0',
    fontFamily: 'var(--font-body)',
  },
  sendBtn: {
    width:          '36px',
    height:         '36px',
    borderRadius:   '50%',
    background:     'var(--color-accent)',
    color:          '#fff',
    border:         'none',
    fontSize:       '18px',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    cursor:         'pointer',
    flexShrink:     0,
    transition:     'opacity 0.15s',
  },

  // Triage area
  triageArea: {
    flex:          1,
    overflowY:     'auto',
    padding:       '0 20px',
    display:       'flex',
    flexDirection: 'column',
    gap:           'var(--space-2)',
  },

  // Raw inbox list
  inboxList: {
    display:       'flex',
    flexDirection: 'column',
    gap:           'var(--space-2)',
    marginBottom:  'var(--space-3)',
  },

  // Empty state
  empty: {
    flex:           1,
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            'var(--space-3)',
    padding:        'var(--space-10) 20px',
  },
  emptyIcon: {
    fontSize:   '40px',
    color:      'var(--color-faint)',
    lineHeight: 1,
  },
  emptyText: {
    fontSize:  '14px',
    color:     'var(--color-muted)',
    textAlign: 'center',
  },

  // Inbox item (raw capture)
  inboxItemWrap: {
    background:   'var(--color-card)',
    border:       'var(--border)',
    borderRadius: 'var(--radius-card)',
    overflow:     'hidden',
  },
  flashWrap: {
    background:     'var(--color-success-bg)',
    border:         '0.5px solid var(--color-success)',
    borderRadius:   'var(--radius-card)',
    padding:        '18px 14px',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
  },
  flashText: {
    fontSize:      '14px',
    fontWeight:    600,
    color:         'var(--color-success)',
    letterSpacing: '0.01em',
  },
  inboxItemRow: {
    display:    'flex',
    alignItems: 'flex-start',
    gap:        'var(--space-3)',
    padding:    '14px 14px 10px',
  },
  dot: {
    width:        '7px',
    height:       '7px',
    borderRadius: '50%',
    background:   'var(--color-accent)',
    flexShrink:   0,
    marginTop:    '5px',
  },
  inboxItemText: {
    flex:       1,
    fontSize:   '15px',
    color:      'var(--color-text)',
    lineHeight: 1.4,
  },
  timestamp: {
    fontSize:   '11px',
    color:      'var(--color-muted)',
    flexShrink: 0,
    marginTop:  '3px',
  },
  actions: {
    display: 'flex',
    gap:     'var(--space-2)',
    padding: '0 14px 12px',
    flexWrap: 'wrap',
  },
  actionBtn: {
    padding:      '5px 12px',
    borderRadius: 'var(--radius-pill)',
    background:   'var(--color-chart-bar)',
    border:       'var(--border)',
    color:        'var(--color-muted)',
    fontSize:     '12px',
    fontWeight:   500,
    cursor:       'pointer',
    transition:   'color 0.15s',
  },

  // Collapsible triage section
  triageSection: {
    background:   'var(--color-card)',
    border:       'var(--border)',
    borderRadius: 'var(--radius-card)',
    overflow:     'hidden',
  },
  sectionHeader: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '14px 16px',
    width:          '100%',
    background:     'none',
    border:         'none',
    cursor:         'pointer',
  },
  sectionHeaderLeft: {
    display:    'flex',
    alignItems: 'center',
    gap:        'var(--space-2)',
  },
  sectionTitle: {
    fontSize:      '11px',
    fontWeight:    600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color:         'var(--color-muted)',
  },
  sectionBadge: {
    padding:      '2px 7px',
    borderRadius: 'var(--radius-pill)',
    background:   'var(--color-accent-bg)',
    color:        'var(--color-accent)',
    fontSize:     '11px',
    fontWeight:   600,
  },
  chevron: {
    fontSize:   '14px',
    color:      'var(--color-muted)',
    transition: 'transform 300ms ease',
    lineHeight: 1,
  },
  sectionBody: {
    borderTop: 'var(--border)',
    padding:   'var(--space-3)',
  },
  sectionStack: {
    display:       'flex',
    flexDirection: 'column',
    gap:           'var(--space-2)',
  },
  emptySection: {
    fontSize:   '13px',
    color:      'var(--color-muted)',
    textAlign:  'center',
    padding:    'var(--space-4) 0',
    lineHeight: 1.5,
  },

  // Task pool row
  triageRow: {
    display:     'flex',
    alignItems:  'center',
    padding:     '12px 14px',
    gap:         'var(--space-3)',
    background:  'var(--color-bg)',
    borderRadius: 'var(--radius-sm)',
    border:      'var(--border)',
  },
  triageRowText: {
    flex:       1,
    fontSize:   '14px',
    color:      'var(--color-text)',
    lineHeight: 1.4,
  },
  queueBadge: {
    padding:      '3px 9px',
    borderRadius: 'var(--radius-pill)',
    background:   'var(--color-accent-bg)',
    color:        'var(--color-accent)',
    fontSize:     '11px',
    fontWeight:   600,
    flexShrink:   0,
  },

  // Calendar row
  calendarRow: {
    display:       'flex',
    flexDirection: 'column',
    gap:           'var(--space-2)',
    padding:       '12px 14px',
    background:    'var(--color-bg)',
    borderRadius:  'var(--radius-sm)',
    border:        'var(--border)',
  },
  calendarPickers: {
    display:    'flex',
    gap:        'var(--space-2)',
    alignItems: 'center',
    flexWrap:   'wrap',
  },
  dateInput: {
    background:   'var(--color-faint)',
    border:       'var(--border)',
    borderRadius: 'var(--radius-sm)',
    color:        'var(--color-text)',
    fontSize:     '12px',
    padding:      '6px 10px',
    fontFamily:   'var(--font-body)',
    outline:      'none',
    colorScheme:  'dark',
  },
  confirmCalBtn: {
    padding:      '6px 14px',
    borderRadius: 'var(--radius-pill)',
    background:   'var(--color-accent)',
    color:        '#fff',
    border:       'none',
    fontSize:     '12px',
    fontWeight:   600,
    cursor:       'pointer',
    transition:   'opacity 0.15s',
  },
  calendarConfirmed: {
    background:   'none',
    border:       'none',
    color:        'var(--color-accent)',
    fontSize:     '12px',
    fontWeight:   500,
    cursor:       'pointer',
    textAlign:    'left',
    padding:      0,
    fontFamily:   'var(--font-body)',
    textDecoration: 'underline',
    textDecorationColor: 'var(--color-accent)',
  },

  // Note row
  noteRow: {
    display:     'flex',
    alignItems:  'flex-start',
    justifyContent: 'space-between',
    padding:     '12px 14px',
    gap:         'var(--space-3)',
    background:  'var(--color-bg)',
    borderRadius: 'var(--radius-sm)',
    border:      'var(--border)',
    cursor:      'default',
    userSelect:  'none',
  },
  noteLeft: {
    display:    'flex',
    alignItems: 'flex-start',
    gap:        'var(--space-2)',
    flex:       1,
  },
  pinIndicator: {
    fontSize:   '9px',
    color:      'var(--color-accent)',
    flexShrink: 0,
    lineHeight: 1.8,
  },
  noteTimestamp: {
    fontSize:   '11px',
    color:      'var(--color-muted)',
    flexShrink: 0,
    marginTop:  '2px',
  },
}
