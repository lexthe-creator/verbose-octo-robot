import { createContext, useContext, useReducer, useEffect } from 'react'

const SETTINGS_STORAGE_KEY = 'aiml_settings'
const SCHEMA_VERSION       = 1

const initialSettingsState = {
  theme:             'dark',
  gymAccess:         'bodyweight',
  plaidConnected:    false,
  calendarConnected: false,
  modules: {
    fitness:    true,
    nutrition:  false,
    goals:      false,
    reflection: false,
    finance:    true,
    focus:      true,
    habits:     false,
    sleep:      false,
  },
}

function migrateSettings(stored) {
  if (!stored) return initialSettingsState
  if (stored.version === 1) {
    const data = stored.data
    return {
      ...initialSettingsState,
      ...data,
      modules: { ...initialSettingsState.modules, ...(data.modules || {}) },
    }
  }
  return initialSettingsState
}

function loadSettingsState() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (raw) return migrateSettings(JSON.parse(raw))

    // One-time migration from legacy aiml_state
    const legacyRaw = localStorage.getItem('aiml_state')
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw)
      if (legacy.settings) {
        return {
          ...initialSettingsState,
          ...legacy.settings,
          modules: { ...initialSettingsState.modules },
        }
      }
    }
    return initialSettingsState
  } catch {
    return initialSettingsState
  }
}

function saveSettingsState(state) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, data: state }))
  } catch { /* quota exceeded */ }
}

export function settingsReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_SETTING': {
      const { key, value } = action.payload
      return { ...state, [key]: value }
    }
    case 'UPDATE_MODULE': {
      const { module, enabled } = action.payload
      return { ...state, modules: { ...state.modules, [module]: enabled } }
    }
    default:
      return state
  }
}

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settingsState, settingsDispatch] = useReducer(settingsReducer, undefined, loadSettingsState)

  useEffect(() => { saveSettingsState(settingsState) }, [settingsState])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settingsState.theme || 'dark')
  }, [settingsState.theme])

  return (
    <SettingsContext.Provider value={{ settingsState, settingsDispatch }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>')
  return ctx
}
