import { useState, useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'

function formatTimestamp(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  if (mins  <  1) return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Single inbox row ─────────────────────────────────────────────────────────

function InboxItem({ item, exiting, flashing, onAction }) {
  if (flashing) {
    return (
      <div style={s.flashWrap}>
        <span style={s.flashText}>Added to tasks ✓</span>
      </div>
    )
  }

  return (
    <div
      style={{
        ...s.itemWrap,
        opacity:   exiting ? 0 : 1,
        transform: exiting ? 'translateX(-40px)' : 'translateX(0)',
        transition: 'opacity 200ms ease, transform 200ms ease',
      }}
    >
      <div style={s.itemRow}>
        <span style={s.dot} />
        <span style={s.itemText}>{item.text}</span>
        <span style={s.timestamp}>{formatTimestamp(item.createdAt)}</span>
      </div>
      <div style={s.actions}>
        <button style={s.actionBtn} onClick={() => onAction(item.id, 'task')}>
          Task
        </button>
        <button style={s.actionBtn} onClick={() => onAction(item.id, 'calendar')}>
          Calendar
        </button>
        <button
          style={{ ...s.actionBtn, color: 'var(--color-danger)' }}
          onClick={() => onAction(item.id, 'delete')}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Inbox() {
  const { state, dispatch } = useApp()
  const [inputText, setInputText] = useState('')
  const [exitingId, setExitingId] = useState(null)
  const [flashingId, setFlashingId] = useState(null)
  const inputRef   = useRef(null)

  function handleSubmit() {
    const text = inputText.trim()
    if (!text) return
    dispatch({ type: 'ADD_INBOX_ITEM', payload: text })
    setInputText('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSubmit()
  }

  function handleAction(itemId, action) {
    if (exitingId || flashingId) return

    if (action === 'task') {
      const item = state.inboxItems.find(i => i.id === itemId)
      if (!item) return
      dispatch({ type: 'ADD_TASK', payload: { text: item.text } })
      setFlashingId(itemId)
      setTimeout(() => {
        setFlashingId(null)
        setExitingId(itemId)
        setTimeout(() => {
          dispatch({ type: 'REMOVE_INBOX_ITEM', payload: itemId })
          setExitingId(null)
        }, 200)
      }, 600)
      return
    }

    setExitingId(itemId)
    setTimeout(() => {
      dispatch({ type: 'REMOVE_INBOX_ITEM', payload: itemId })
      setExitingId(null)
    }, 200)
  }

  const isEmpty = state.inboxItems.length === 0

  return (
    <div style={s.screen}>
      <style>{`.inbox-input::placeholder { color: var(--color-faint); }`}</style>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div style={s.header}>
        <div style={s.headerRow}>
          <h1 style={s.title}>Inbox</h1>
          {state.inboxItems.length > 0 && (
            <span style={s.badge}>{state.inboxItems.length}</span>
          )}
        </div>
        <p style={s.subtitle}>Capture anything. Sort later.</p>
      </div>

      {/* ── Capture bar ──────────────────────────────────────────────── */}
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

      {/* ── List / empty state ────────────────────────────────────────── */}
      {isEmpty ? (
        <div style={s.empty}>
          <span style={s.emptyIcon}>◎</span>
          <p style={s.emptyText}>Clear mind. Add something above.</p>
        </div>
      ) : (
        <div style={s.list}>
          {state.inboxItems.map(item => (
            <InboxItem
              key={item.id}
              item={item}
              exiting={exitingId === item.id}
              flashing={flashingId === item.id}
              onAction={handleAction}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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

  // Item list
  list: {
    display:       'flex',
    flexDirection: 'column',
    gap:           'var(--space-2)',
    padding:       '0 20px',
    overflowY:     'auto',
  },
  itemWrap: {
    background:    'var(--color-card)',
    border:        'var(--border)',
    borderRadius:  'var(--radius-card)',
    overflow:      'hidden',
  },
  flashWrap: {
    background:    'var(--color-success-bg)',
    border:        '0.5px solid var(--color-success)',
    borderRadius:  'var(--radius-card)',
    padding:       '18px 14px',
    display:       'flex',
    alignItems:    'center',
    justifyContent:'center',
    transition:    'background 150ms ease',
  },
  flashText: {
    fontSize:   '14px',
    fontWeight: 600,
    color:      'var(--color-success)',
    letterSpacing: '0.01em',
  },
  itemRow: {
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
  itemText: {
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

  // Action pills
  actions: {
    display:    'flex',
    gap:        'var(--space-2)',
    padding:    '0 14px 12px',
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
}
