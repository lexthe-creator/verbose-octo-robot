import { createContext, useContext, useReducer, useEffect } from 'react'

const USER_STORAGE_KEY = 'aiml_user'
const SCHEMA_VERSION   = 1

const initialUserState = {
  name:      'Lex',
  wakeTime:  '06:00',
  sleepTime: '23:00',
}

function migrateUser(stored) {
  if (!stored) return initialUserState
  if (stored.version === 1) return stored.data
  return initialUserState
}

function loadUserState() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    if (raw) return migrateUser(JSON.parse(raw))

    // One-time migration from legacy aiml_state
    const legacyRaw = localStorage.getItem('aiml_state')
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw)
      if (legacy.profile) return { ...initialUserState, ...legacy.profile }
    }
    return initialUserState
  } catch {
    return initialUserState
  }
}

function saveUserState(state) {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, data: state }))
  } catch { /* quota exceeded */ }
}

export function userReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_PROFILE': {
      const { key, value } = action.payload
      return { ...state, [key]: value }
    }
    default:
      return state
  }
}

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [userState, userDispatch] = useReducer(userReducer, undefined, loadUserState)

  useEffect(() => { saveUserState(userState) }, [userState])

  return (
    <UserContext.Provider value={{ userState, userDispatch }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>')
  return ctx
}
