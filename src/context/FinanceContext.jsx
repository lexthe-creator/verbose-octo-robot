import { createContext, useContext, useReducer, useEffect } from 'react'
import { getTodayISO } from '../utils/time.js'
import { getWeekDates } from '../utils/fitness.js'

const FINANCE_STORAGE_KEY = 'aiml_finance'
const SCHEMA_VERSION      = 1

/* ─── Selectors ───────────────────────────────────────────────────────────── */
export function getTodaySpend(transactions) {
  const today = getTodayISO()
  return transactions
    .filter(t => t.date === today && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
}

export function getWeeklySpend(transactions) {
  const dates = getWeekDates()
  const keys  = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  const result = {}
  dates.forEach((d, i) => {
    const ds = d.toISOString().slice(0, 10)
    result[keys[i]] = transactions
      .filter(t => t.date === ds && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  })
  return result
}

export function getWeekTotal(transactions) {
  const dateSet = new Set(getWeekDates().map(d => d.toISOString().slice(0, 10)))
  return transactions
    .filter(t => dateSet.has(t.date) && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
}

export function getFourWeekAvg(transactions) {
  const today = new Date()
  const totals = [7, 14, 21, 28].map(daysBack => {
    const d = new Date(today)
    d.setDate(today.getDate() - daysBack)
    const ds = d.toISOString().slice(0, 10)
    return transactions
      .filter(t => t.date === ds && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  })
  return totals.reduce((a, b) => a + b, 0) / 4
}

export function getOddTransaction(transactions) {
  return transactions.find(t => Math.abs(t.amount) > 200) ?? null
}

export function getTodayTransactions(transactions) {
  const today = getTodayISO()
  return transactions.filter(t => t.date === today)
}

/* ─── Reducer ─────────────────────────────────────────────────────────────── */
export function financeReducer(state, action) {
  switch (action.type) {
    case 'ADD_TRANSACTION': {
      const tx = { id: `tx${Date.now()}`, ...action.payload }
      return { ...state, transactions: [tx, ...state.transactions] }
    }
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload.id),
      }
    default:
      return state
  }
}

/* ─── Persistence ─────────────────────────────────────────────────────────── */
const initialFinanceState = { transactions: [] }

function loadFinanceState() {
  try {
    const raw = localStorage.getItem(FINANCE_STORAGE_KEY)
    if (raw) {
      const stored = JSON.parse(raw)
      if (stored.version === SCHEMA_VERSION) return { ...initialFinanceState, ...stored.data }
      return initialFinanceState
    }
    // One-time migration from legacy aiml_state
    const legacyRaw = localStorage.getItem('aiml_state')
    if (legacyRaw) {
      try {
        const parsed = JSON.parse(legacyRaw)
        return { ...initialFinanceState, transactions: parsed.transactions ?? [] }
      } catch {
        return initialFinanceState
      }
    }
    return initialFinanceState
  } catch {
    return initialFinanceState
  }
}

function saveFinanceState(state) {
  try {
    localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({ version: SCHEMA_VERSION, data: state })
    )
  } catch { /* quota exceeded */ }
}

/* ─── Context ─────────────────────────────────────────────────────────────── */
const FinanceContext = createContext(null)

export function FinanceProvider({ children }) {
  const [financeState, financeDispatch] = useReducer(financeReducer, undefined, loadFinanceState)

  useEffect(() => { saveFinanceState(financeState) }, [financeState])

  return (
    <FinanceContext.Provider value={{ financeState, financeDispatch }}>
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used inside <FinanceProvider>')
  return ctx
}
