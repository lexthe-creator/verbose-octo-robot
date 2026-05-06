// TODO V2: Twilio SMS pipeline
import { useState, useRef, useEffect } from 'react'
import { useSettings } from '../context/SettingsContext.jsx'
import {
  useFinance,
  getTodaySpend, getWeeklySpend, getWeekTotal,
  getFourWeekAvg, getOddTransaction, getTodayTransactions,
} from '../context/index.js'
import { getTodayISO } from '../utils/time.js'
import { getWeekDates } from '../utils/fitness.js'

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Health', 'Bills', 'Other']

const CATEGORY_EMOJI = {
  Food:      '🍔',
  Transport: '🚗',
  Shopping:  '🛍',
  Health:    '💊',
  Bills:     '💡',
  Other:     '📌',
}

const DAY_INITIAL = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// ─── Formatting helpers ────────────────────────────────────────────────────────

function formatAmount(n) {
  const abs     = Math.abs(n)
  const dollars = Math.floor(abs).toLocaleString('en-US')
  const cents   = String(Math.round((abs % 1) * 100)).padStart(2, '0')
  return { dollars, cents, sign: n < 0 ? '-' : '+' }
}

function getWeeklyBars(transactions) {
  const weekly = getWeeklySpend(transactions)
  const today  = getTodayISO()
  const dates  = getWeekDates()
  const keys   = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  return dates.map((d, i) => ({
    day:     DAY_INITIAL[i],
    amount:  weekly[keys[i]],
    isToday: d.toISOString().slice(0, 10) === today,
  }))
}

// ─── Weekly bar chart ─────────────────────────────────────────────────────────

const MAX_HEIGHT = 48
const BAR_WIDTH  = 18

function WeeklyBars({ data }) {
  const maxVal = Math.max(...data.map(d => d.amount), 1)
  return (
    <div style={bc.wrap}>
      {data.map((d, i) => {
        const h = d.amount > 0 ? Math.max(4, Math.round((d.amount / maxVal) * MAX_HEIGHT)) : 4
        return (
          <div key={i} style={bc.col}>
            <div style={bc.barTrack}>
              <div style={{
                ...bc.bar,
                height:     `${h}px`,
                background: d.isToday ? 'var(--color-accent)' : 'var(--color-chart-bar)',
              }} />
            </div>
            <span style={{ ...bc.label, color: d.isToday ? 'var(--color-accent)' : 'var(--color-faint)' }}>
              {d.day}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const bc = {
  wrap:     { display: 'flex', alignItems: 'flex-end', gap: '4px', paddingTop: '4px' },
  col:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' },
  barTrack: { height: `${MAX_HEIGHT}px`, display: 'flex', alignItems: 'flex-end' },
  bar:      { width: `${BAR_WIDTH}px`, borderRadius: '3px 3px 0 0', transition: 'height 0.3s ease' },
  label:    { fontSize: '8px', fontWeight: 500, letterSpacing: '0.03em' },
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, valueColor, sub }) {
  return (
    <div style={sc.card}>
      <p style={sc.label}>{label}</p>
      <p style={{ ...sc.value, color: valueColor }}>{value}</p>
      <p style={sc.sub}>{sub}</p>
    </div>
  )
}

const sc = {
  card:  { background: 'var(--color-card)', border: 'var(--border)', borderRadius: '12px', padding: '12px', flex: 1 },
  label: { fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-faint)', margin: '0 0 4px' },
  value: { fontFamily: 'var(--font-display)', fontSize: '20px', lineHeight: 1, margin: '0 0 3px' },
  sub:   { fontSize: '10px', color: 'var(--color-faint)', margin: 0 },
}

// ─── Transaction row (swipe left → delete zone) ────────────────────────────────

function TxRow({ tx, onDelete }) {
  const [offset,  setOffset]  = useState(0)
  const [exiting, setExiting] = useState(false)
  const startXRef = useRef(0)
  const DELETE_W  = 72

  function handleTouchStart(e) { startXRef.current = e.touches[0].clientX }

  function handleTouchMove(e) {
    const delta = startXRef.current - e.touches[0].clientX
    if (delta > 0) setOffset(Math.min(DELETE_W, delta))
    else setOffset(0)
  }

  function handleTouchEnd() {
    if (offset >= DELETE_W * 0.6) setOffset(DELETE_W)
    else setOffset(0)
  }

  function handleDelete() {
    setExiting(true)
    setTimeout(onDelete, 200)
  }

  const { dollars, cents, sign } = formatAmount(tx.amount)
  const icon = CATEGORY_EMOJI[tx.category] || '📌'

  return (
    <div style={{ position: 'relative', borderRadius: '11px', overflow: 'hidden' }}>
      {/* Red delete zone revealed by swipe */}
      <div style={tx_s.deleteZone} onClick={handleDelete}>
        <span style={{ color: 'var(--color-danger)', fontSize: '12px', fontWeight: 700 }}>Delete</span>
      </div>
      {/* Sliding row */}
      <div
        style={{
          ...tx_s.row,
          transform:  exiting ? 'translateX(-100%)' : `translateX(-${offset}px)`,
          transition: exiting
            ? 'transform 200ms ease'
            : offset === 0 ? 'transform 200ms ease' : 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div style={tx_s.iconWrap}>
          <span style={tx_s.icon}>{icon}</span>
        </div>
        <div style={tx_s.info}>
          <span style={tx_s.merchant}>{tx.merchant}</span>
          <span style={tx_s.category}>{tx.category}</span>
        </div>
        <span style={{ ...tx_s.amount, color: tx.amount < 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
          {sign}${dollars}.{cents}
        </span>
      </div>
    </div>
  )
}

const tx_s = {
  deleteZone: {
    position:       'absolute',
    right:          0, top: 0, bottom: 0,
    width:          '72px',
    background:     'var(--color-danger-border)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    cursor:         'pointer',
  },
  row: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
    background: 'var(--color-card)',
    border:     'var(--border)',
    borderRadius: '11px',
    padding:    '9px 12px',
  },
  iconWrap: { width: '28px', height: '28px', borderRadius: '8px', background: 'var(--color-chart-bar)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  icon:     { fontSize: '14px', lineHeight: 1 },
  info:     { flex: 1, display: 'flex', flexDirection: 'column', gap: '1px' },
  merchant: { fontSize: '12px', color: 'var(--color-text)', fontWeight: 500 },
  category: { fontSize: '10px', color: 'var(--color-faint)' },
  amount:   { fontSize: '13px', fontWeight: 600, flexShrink: 0 },
}

// ─── Add Transaction bottom sheet ─────────────────────────────────────────────

function TransactionSheet({ onClose, onSave }) {
  const [visible,  setVisible]  = useState(false)
  const [merchant, setMerchant] = useState('')
  const [amount,   setAmount]   = useState('')
  const [isIncome, setIsIncome] = useState(false)
  const [category, setCategory] = useState('Food')
  const [date,     setDate]     = useState(getTodayISO())

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function close() {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  function handleSave() {
    if (!merchant.trim() || !amount) return
    const sign = isIncome ? 1 : -1
    onSave({
      merchant: merchant.trim(),
      amount:   sign * Math.abs(parseFloat(amount)),
      category,
      date,
    })
    close()
  }

  return (
    <div
      style={{ ...sh.backdrop, opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none' }}
      onClick={close}
    >
      <div
        style={{ ...sh.box, transform: visible ? 'translateY(0)' : 'translateY(100%)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={sh.title}>Add Transaction</h3>

        <div style={sh.field}>
          <label style={sh.label}>Merchant</label>
          <input
            type="text"
            style={sh.input}
            placeholder="e.g. Starbucks"
            value={merchant}
            onChange={e => setMerchant(e.target.value)}
          />
        </div>

        <div style={sh.field}>
          <label style={sh.label}>Amount</label>
          <div style={sh.amountRow}>
            <input
              type="number"
              style={{ ...sh.input, flex: 1 }}
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="0"
              step="0.01"
            />
            <div style={sh.toggle}>
              {['Spend', 'Income'].map(opt => {
                const active = isIncome === (opt === 'Income')
                return (
                  <button
                    key={opt}
                    style={{
                      ...sh.toggleBtn,
                      background: active ? 'var(--color-accent-bg)' : 'transparent',
                      color:      active ? 'var(--color-accent)'    : 'var(--color-muted)',
                      border:     active ? '0.5px solid var(--color-accent)' : '0.5px solid transparent',
                    }}
                    onClick={() => setIsIncome(opt === 'Income')}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div style={sh.field}>
          <label style={sh.label}>Category</label>
          <div style={sh.pillWrap}>
            {CATEGORIES.map(cat => {
              const active = category === cat
              return (
                <button
                  key={cat}
                  style={{
                    ...sh.pill,
                    background: active ? 'var(--color-accent-bg)' : 'var(--color-chart-bar)',
                    color:      active ? 'var(--color-accent)'    : 'var(--color-muted)',
                    border:     active ? '0.5px solid var(--color-accent)' : 'var(--border)',
                  }}
                  onClick={() => setCategory(cat)}
                >
                  {CATEGORY_EMOJI[cat]} {cat}
                </button>
              )
            })}
          </div>
        </div>

        <div style={sh.field}>
          <label style={sh.label}>Date</label>
          <input
            type="date"
            style={sh.input}
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <button
          style={{ ...sh.saveBtn, opacity: merchant.trim() && amount ? 1 : 0.45 }}
          onClick={handleSave}
        >
          Save transaction
        </button>
      </div>
    </div>
  )
}

const sh = {
  backdrop: {
    position:       'fixed',
    inset:          0,
    background:     'rgba(0,0,0,0.6)',
    zIndex:         200,
    transition:     'opacity 250ms ease',
    display:        'flex',
    alignItems:     'flex-end',
    justifyContent: 'center',
  },
  box: {
    width:                '100%',
    maxWidth:             'var(--max-width)',
    background:           'var(--color-card)',
    borderTopLeftRadius:  '20px',
    borderTopRightRadius: '20px',
    padding:              '24px',
    paddingBottom:        'calc(24px + var(--safe-bottom))',
    transition:           'transform 250ms var(--ease-out)',
    display:              'flex',
    flexDirection:        'column',
    gap:                  '16px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize:   '22px',
    color:      'var(--color-text)',
    lineHeight: 1.2,
  },
  field:    { display: 'flex', flexDirection: 'column', gap: '8px' },
  label:    { fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' },
  input:    { height: '42px', background: 'var(--color-chart-bar)', border: 'var(--border)', borderRadius: '10px', color: 'var(--color-text)', fontFamily: 'var(--font-body)', fontSize: '15px', padding: '0 12px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  amountRow: { display: 'flex', gap: '8px', alignItems: 'stretch' },
  toggle:    { display: 'flex', gap: '3px', background: 'var(--color-chart-bar)', borderRadius: '8px', padding: '3px', flexShrink: 0 },
  toggleBtn: { padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
  pillWrap:  { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  pill:      { padding: '7px 11px', borderRadius: 'var(--radius-pill)', fontSize: '12px', fontWeight: 500, cursor: 'pointer' },
  saveBtn:   { width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--color-accent)', color: '#fff', fontSize: '15px', fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: '4px', transition: 'opacity 0.15s' },
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Finance() {
  const { financeState, financeDispatch } = useFinance()
  const { settingsState }                 = useSettings()
  const transactions   = financeState.transactions
  const plaidConnected = settingsState.plaidConnected

  const [showSheet, setShowSheet] = useState(false)

  const todaySpend = getTodaySpend(transactions)
  const weeklyBars = getWeeklyBars(transactions)
  const weekTotal  = getWeekTotal(transactions)
  const fourWkAvg  = getFourWeekAvg(transactions)
  const oddTx      = getOddTransaction(transactions)
  const todayList  = getTodayTransactions(transactions)

  const { dollars, cents } = formatAmount(todaySpend)

  const isOdd = oddTx !== null

  let comparisonLine
  if (fourWkAvg === 0) {
    comparisonLine = 'No prior data for comparison'
  } else {
    const diff = fourWkAvg - todaySpend
    comparisonLine = diff >= 0
      ? `↓ $${Math.abs(diff).toFixed(2)} less than your 4-week average`
      : `↑ $${Math.abs(diff).toFixed(2)} more than your 4-week average`
  }

  return (
    <div style={s.screen}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={s.header}>
        <div style={s.headerRow}>
          <h1 style={s.title}>Finance</h1>
          <div style={s.headerRight}>
            {plaidConnected ? (
              <span style={{ ...s.badge, background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '0.5px solid var(--color-success-border)' }}>
                ● Plaid connected
              </span>
            ) : (
              <span style={{ ...s.badge, background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '0.5px solid var(--color-danger-border)' }}>
                ● Not connected
              </span>
            )}
            <button style={s.addBtn} onClick={() => setShowSheet(true)}>+ Add</button>
          </div>
        </div>
        {plaidConnected && <p style={s.subtitle}>synced automatically</p>}
      </div>

      {/* ── Hero card ──────────────────────────────────────────────────── */}
      <div style={s.hero}>
        <p style={s.heroLabel}>Spent today</p>
        <div style={s.heroAmount}>
          <span style={s.heroDollars}>${dollars}</span>
          <span style={s.heroCents}>.{cents}</span>
        </div>
        <p style={s.comparison}>{comparisonLine}</p>
        <WeeklyBars data={weeklyBars} />
      </div>

      {/* ── Stat grid ──────────────────────────────────────────────────── */}
      <div style={s.statGrid}>
        <StatCard
          label="This week"
          value={`$${weekTotal.toFixed(2)}`}
          valueColor="var(--color-accent)"
          sub="total spend"
        />
        <StatCard
          label="Anything odd?"
          value={isOdd ? 'Check it' : 'All clear'}
          valueColor={isOdd ? 'var(--color-accent)' : 'var(--color-success)'}
          sub={isOdd ? 'Transaction over $200' : 'No unusual charges'}
        />
      </div>

      {/* ── Transactions ───────────────────────────────────────────────── */}
      <div style={s.section}>
        <p style={s.sectionLabel}>Today's transactions</p>
        {todayList.length === 0 ? (
          <p style={s.empty}>No transactions today — tap + Add to log one.</p>
        ) : (
          <div style={s.txList}>
            {todayList.map(tx => (
              <TxRow
                key={tx.id}
                tx={tx}
                onDelete={() => financeDispatch({ type: 'DELETE_TRANSACTION', payload: { id: tx.id } })}
              />
            ))}
          </div>
        )}
      </div>

      {showSheet && (
        <TransactionSheet
          onClose={() => setShowSheet(false)}
          onSave={payload => financeDispatch({ type: 'ADD_TRANSACTION', payload })}
        />
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

  header: {
    padding:       '0 20px var(--space-5)',
    display:       'flex',
    flexDirection: 'column',
    gap:           'var(--space-1)',
  },
  headerRow: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  headerRight: {
    display:    'flex',
    alignItems: 'center',
    gap:        '8px',
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
    fontSize:     '11px',
    fontWeight:   600,
  },
  addBtn: {
    padding:      '5px 12px',
    borderRadius: 'var(--radius-pill)',
    background:   'var(--color-accent)',
    color:        '#fff',
    fontSize:     '12px',
    fontWeight:   600,
    border:       'none',
    cursor:       'pointer',
  },
  subtitle: {
    fontSize: '13px',
    color:    'var(--color-muted)',
  },

  hero: {
    margin:       '0 20px var(--space-4)',
    background:   'var(--color-card)',
    border:       'var(--border)',
    borderRadius: '14px',
    padding:      '16px',
  },
  heroLabel: {
    fontSize:      '9px',
    fontWeight:    700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color:         'var(--color-muted)',
    margin:        '0 0 6px',
  },
  heroAmount: {
    display:      'flex',
    alignItems:   'baseline',
    gap:          '1px',
    marginBottom: '4px',
  },
  heroDollars: {
    fontFamily:    'var(--font-display)',
    fontSize:      '38px',
    color:         'var(--color-text)',
    lineHeight:    1,
    letterSpacing: '-1px',
  },
  heroCents: {
    fontFamily: 'var(--font-display)',
    fontSize:   '22px',
    color:      'var(--color-faint)',
    lineHeight: 1,
  },
  comparison: {
    fontSize: '12px',
    color:    'var(--color-faint)',
    margin:   '0 0 14px',
  },

  statGrid: {
    display: 'flex',
    gap:     '8px',
    margin:  '0 20px var(--space-4)',
  },

  section: { padding: '0 20px' },
  sectionLabel: {
    fontSize:      '11px',
    fontWeight:    600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color:         'var(--color-muted)',
    margin:        '0 0 10px',
  },
  txList: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '6px',
  },
  empty: {
    fontSize:  '13px',
    color:     'var(--color-faint)',
    textAlign: 'center',
    padding:   '24px 0',
    lineHeight: 1.4,
  },
}
