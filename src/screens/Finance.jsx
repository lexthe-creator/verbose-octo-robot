// TODO: replace with Plaid API in V2

// ─── Mock data ────────────────────────────────────────────────────────────────

const TODAY_SPEND = 47.83

// Mon–Sun daily spend for the current week (today = Monday index 0)
const WEEKLY = [
  { day: 'Mon', amount: 47.83, isToday: true  },
  { day: 'Tue', amount: 0,     isToday: false },
  { day: 'Wed', amount: 0,     isToday: false },
  { day: 'Thu', amount: 0,     isToday: false },
  { day: 'Fri', amount: 0,     isToday: false },
  { day: 'Sat', amount: 0,     isToday: false },
  { day: 'Sun', amount: 0,     isToday: false },
]

const WEEK_TOTAL      = 47.83
const LAST_WEEK_TOTAL = 214.52
const MON_AVERAGE     = 59.20   // used for comparison line

const TRANSACTIONS = [
  { id: 1, icon: '☕', merchant: 'Starbucks',          category: 'Coffee',    amount: -6.75,  income: false },
  { id: 2, icon: '🛒', merchant: 'Whole Foods',        category: 'Groceries', amount: -31.40, income: false },
  { id: 3, icon: '⛽', merchant: 'Shell',               category: 'Gas',       amount: -9.68,  income: false },
  { id: 4, icon: '💳', merchant: 'Venmo Transfer',     category: 'Transfer',  amount: 40.00,  income: true  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(n) {
  const abs    = Math.abs(n)
  const dollars = Math.floor(abs).toLocaleString('en-US')
  const cents   = String(Math.round((abs % 1) * 100)).padStart(2, '0')
  return { dollars, cents, sign: n < 0 ? '-' : '+' }
}

// ─── Weekly bar chart ─────────────────────────────────────────────────────────

const MAX_HEIGHT = 48
const BAR_WIDTH  = 18

function WeeklyBars() {
  const maxVal = Math.max(...WEEKLY.map(d => d.amount), 1)

  return (
    <div style={bc.wrap}>
      {WEEKLY.map(d => {
        const h = d.amount > 0 ? Math.max(4, Math.round((d.amount / maxVal) * MAX_HEIGHT)) : 4
        return (
          <div key={d.day} style={bc.col}>
            <div style={bc.barTrack}>
              <div style={{
                ...bc.bar,
                height:     `${h}px`,
                background: d.isToday ? '#C17B56' : '#252520',
              }} />
            </div>
            <span style={{ ...bc.label, color: d.isToday ? '#C17B56' : '#3A3A30' }}>
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
  card:  { background: '#1E1E18', border: '0.5px solid #2A2A22', borderRadius: '12px', padding: '12px', flex: 1 },
  label: { fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3A3A30', margin: '0 0 4px' },
  value: { fontFamily: 'var(--font-display)', fontSize: '20px', lineHeight: 1, margin: '0 0 3px' },
  sub:   { fontSize: '10px', color: '#4A4A40', margin: 0 },
}

// ─── Transaction row ──────────────────────────────────────────────────────────

function TxRow({ tx }) {
  const { dollars, cents, sign } = formatAmount(tx.amount)
  return (
    <div style={tx_s.row}>
      <div style={tx_s.iconWrap}>
        <span style={tx_s.icon}>{tx.icon}</span>
      </div>
      <div style={tx_s.info}>
        <span style={tx_s.merchant}>{tx.merchant}</span>
        <span style={tx_s.category}>{tx.category}</span>
      </div>
      <span style={{ ...tx_s.amount, color: tx.income ? '#1D9E75' : '#E05555' }}>
        {sign}${dollars}.{cents}
      </span>
    </div>
  )
}

const tx_s = {
  row:      { display: 'flex', alignItems: 'center', gap: '10px', background: '#1E1E18', border: '0.5px solid #2A2A22', borderRadius: '11px', padding: '9px 12px' },
  iconWrap: { width: '28px', height: '28px', borderRadius: '8px', background: '#252520', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  icon:     { fontSize: '14px', lineHeight: 1 },
  info:     { flex: 1, display: 'flex', flexDirection: 'column', gap: '1px' },
  merchant: { fontSize: '12px', color: '#C8C4BC', fontWeight: 500 },
  category: { fontSize: '10px', color: '#3A3A30' },
  amount:   { fontSize: '13px', fontWeight: 600, flexShrink: 0 },
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Finance() {
  const { dollars, cents } = formatAmount(TODAY_SPEND)
  const diff        = MON_AVERAGE - TODAY_SPEND
  const diffStr     = `↓ $${Math.abs(diff).toFixed(2)} less than your Monday average`
  const weekOver    = WEEK_TOTAL > LAST_WEEK_TOTAL
  const weekColor   = weekOver ? '#C17B56' : '#1D9E75'

  return (
    <div style={s.screen}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={s.header}>
        <div style={s.headerRow}>
          <h1 style={s.title}>Finance</h1>
          <span style={s.badge}>● Plaid connected</span>
        </div>
        <p style={s.subtitle}>synced 4 min ago</p>
      </div>

      {/* ── Hero card ──────────────────────────────────────────────────── */}
      <div style={s.hero}>
        <p style={s.heroLabel}>Spent today</p>
        <div style={s.heroAmount}>
          <span style={s.heroDollars}>
            ${dollars}
          </span>
          <span style={s.heroCents}>.{cents}</span>
        </div>
        <p style={s.comparison}>{diffStr}</p>
        <WeeklyBars />
      </div>

      {/* ── Stat grid ──────────────────────────────────────────────────── */}
      <div style={s.statGrid}>
        <StatCard
          label="This week"
          value={`$${WEEK_TOTAL.toFixed(2)}`}
          valueColor={weekColor}
          sub={`vs $${LAST_WEEK_TOTAL.toFixed(2)} last week`}
        />
        <StatCard
          label="Anything odd?"
          value="All clear"
          valueColor="#1D9E75"
          sub="No unusual charges"
        />
      </div>

      {/* ── Transactions ───────────────────────────────────────────────── */}
      <div style={s.section}>
        <p style={s.sectionLabel}>Today's transactions</p>
        <div style={s.txList}>
          {TRANSACTIONS.map(tx => <TxRow key={tx.id} tx={tx} />)}
        </div>
      </div>
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
    background:   '#0C2A1E',
    color:        '#1D9E75',
    border:       '0.5px solid #1A4028',
    fontSize:     '11px',
    fontWeight:   600,
  },
  subtitle: {
    fontSize: '13px',
    color:    'var(--color-muted)',
  },

  // Hero
  hero: {
    margin:       '0 20px var(--space-4)',
    background:   '#1E1E18',
    border:       '0.5px solid #2A2A22',
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
    display:    'flex',
    alignItems: 'baseline',
    gap:        '1px',
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
    color:      '#4A4A40',
    lineHeight: 1,
  },
  comparison: {
    fontSize:     '12px',
    color:        '#4A4A40',
    margin:       '0 0 14px',
  },

  // Stat grid
  statGrid: {
    display:    'flex',
    gap:        '8px',
    margin:     '0 20px var(--space-4)',
  },

  // Transactions
  section: {
    padding: '0 20px',
  },
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
}
