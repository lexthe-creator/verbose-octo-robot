import { createContext, useContext, useReducer, useEffect } from 'react'

const INBOX_STORAGE_KEY = 'aiml_inbox'
const SCHEMA_VERSION    = 2

/* ─── Initial state ───────────────────────────────────────────────────────── */
const initialInboxState = {
  inboxItems:    [],
  taskPool:      [],
  calendarItems: [],
  notes:         [],
}

/* ─── Migration ───────────────────────────────────────────────────────────── */
function migrateFromLegacy(legacyRaw) {
  try {
    const parsed = JSON.parse(legacyRaw)
    return {
      ...initialInboxState,
      inboxItems: parsed.inboxItems ?? [],
    }
  } catch {
    return initialInboxState
  }
}

// v1 → v2: backfill missing fields on existing items
function migrateV1toV2(v1Data) {
  return {
    ...initialInboxState,
    ...v1Data,
    taskPool: (v1Data.taskPool ?? []).map(t => ({
      priority: null,
      ...t,
    })),
    calendarItems: (v1Data.calendarItems ?? []).map(c => ({
      confirmed: false,
      ...c,
    })),
    notes: (v1Data.notes ?? []).map(n => ({
      pinned: false,
      ...n,
    })),
  }
}

/* ─── Persistence ─────────────────────────────────────────────────────────── */
function loadInboxState() {
  try {
    const raw = localStorage.getItem(INBOX_STORAGE_KEY)
    if (raw) {
      const stored = JSON.parse(raw)
      if (stored.version === SCHEMA_VERSION) {
        return { ...initialInboxState, ...stored.data }
      }
      if (stored.version === 1) {
        return migrateV1toV2(stored.data)
      }
      return initialInboxState
    }

    // One-time migration from legacy aiml_state — do not delete aiml_state
    const legacyRaw = localStorage.getItem('aiml_state')
    if (legacyRaw) return migrateFromLegacy(legacyRaw)

    return initialInboxState
  } catch {
    return initialInboxState
  }
}

function saveInboxState(state) {
  try {
    localStorage.setItem(
      INBOX_STORAGE_KEY,
      JSON.stringify({ version: SCHEMA_VERSION, data: state })
    )
  } catch { /* quota exceeded */ }
}

/* ─── Reducer ─────────────────────────────────────────────────────────────── */
export function inboxReducer(state, action) {
  switch (action.type) {

    case 'ADD_INBOX_ITEM': {
      const item = {
        id:        `i${Date.now()}`,
        text:      action.payload.text,
        createdAt: new Date().toISOString(),
      }
      return { ...state, inboxItems: [item, ...state.inboxItems] }
    }

    case 'REMOVE_INBOX_ITEM':
      return { ...state, inboxItems: state.inboxItems.filter(i => i.id !== action.payload.id) }

    case 'TRIAGE_TO_TASK': {
      const { id, text } = action.payload
      const poolItem = {
        id:           `pool_${Date.now()}`,
        text,
        createdAt:    new Date().toISOString(),
        assignedDate: null,
        priority:     null,
      }
      return {
        ...state,
        inboxItems: state.inboxItems.filter(i => i.id !== id),
        taskPool:   [...state.taskPool, poolItem],
      }
    }

    case 'TRIAGE_TO_CALENDAR': {
      const { id, text, date, time } = action.payload
      const calItem = {
        id:        `cal_${Date.now()}`,
        text,
        date:      date ?? null,
        time:      time ?? null,
        confirmed: false,
        createdAt: new Date().toISOString(),
      }
      return {
        ...state,
        inboxItems:    state.inboxItems.filter(i => i.id !== id),
        calendarItems: [...state.calendarItems, calItem],
      }
    }

    case 'TRIAGE_TO_NOTE': {
      const { id, text } = action.payload
      const note = {
        id:        `note_${Date.now()}`,
        text,
        createdAt: new Date().toISOString(),
        pinned:    false,
      }
      return {
        ...state,
        inboxItems: state.inboxItems.filter(i => i.id !== id),
        notes:      [...state.notes, note],
      }
    }

    case 'UPDATE_POOL_TASK': {
      const { id, key, value } = action.payload
      return {
        ...state,
        taskPool: state.taskPool.map(t => t.id === id ? { ...t, [key]: value } : t),
      }
    }

    case 'UPDATE_CALENDAR_ITEM': {
      const { id, date, time } = action.payload
      return {
        ...state,
        calendarItems: state.calendarItems.map(c =>
          c.id === id ? { ...c, date, time, confirmed: true } : c
        ),
      }
    }

    case 'PIN_NOTE': {
      return {
        ...state,
        notes: state.notes.map(n =>
          n.id === action.payload.id ? { ...n, pinned: !n.pinned } : n
        ),
      }
    }

    case 'DELETE_POOL_TASK':
      return { ...state, taskPool: state.taskPool.filter(t => t.id !== action.payload.id) }

    case 'DELETE_CALENDAR_ITEM':
      return { ...state, calendarItems: state.calendarItems.filter(c => c.id !== action.payload.id) }

    case 'DELETE_NOTE':
      return { ...state, notes: state.notes.filter(n => n.id !== action.payload.id) }

    default:
      return state
  }
}

/* ─── Context ─────────────────────────────────────────────────────────────── */
const InboxContext = createContext(null)

export function InboxProvider({ children }) {
  const [inboxState, inboxDispatch] = useReducer(inboxReducer, undefined, loadInboxState)

  useEffect(() => { saveInboxState(inboxState) }, [inboxState])

  return (
    <InboxContext.Provider value={{ inboxState, inboxDispatch }}>
      {children}
    </InboxContext.Provider>
  )
}

export function useInbox() {
  const ctx = useContext(InboxContext)
  if (!ctx) throw new Error('useInbox must be used inside <InboxProvider>')
  return ctx
}
