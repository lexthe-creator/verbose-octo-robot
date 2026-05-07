import { createContext, useContext, useReducer, useEffect } from 'react'

const INBOX_STORAGE_KEY = 'aiml_inbox'
const SCHEMA_VERSION    = 1

/* ─── Initial state ───────────────────────────────────────────────────────── */
// taskPool, calendarItems, notes are V1 placeholders — triage UI built later.
const initialInboxState = {
  inboxItems:    [],
  taskPool:      [],
  calendarItems: [],
  notes:         [],
}

/* ─── Migration ───────────────────────────────────────────────────────────── */
function migrateInboxFromLegacy(legacyRaw) {
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

/* ─── Persistence ─────────────────────────────────────────────────────────── */
function loadInboxState() {
  try {
    const raw = localStorage.getItem(INBOX_STORAGE_KEY)
    if (raw) {
      const stored = JSON.parse(raw)
      if (stored.version === SCHEMA_VERSION) {
        return { ...initialInboxState, ...stored.data }
      }
      return initialInboxState
    }

    // One-time migration from legacy aiml_state — do not delete aiml_state
    const legacyRaw = localStorage.getItem('aiml_state')
    if (legacyRaw) return migrateInboxFromLegacy(legacyRaw)

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
      }
      return {
        ...state,
        inboxItems: state.inboxItems.filter(i => i.id !== id),
        notes:      [...state.notes, note],
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
