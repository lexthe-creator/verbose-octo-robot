import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'

// ─── Tag config ───────────────────────────────────────────────────────────────

const TAG_STYLES = {
  Design:    { bg: 'var(--color-accent-bg)',  color: 'var(--color-accent)'  },
  Etsy:      { bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
  Marketing: { bg: 'var(--color-chart-bar)',  color: 'var(--color-muted)'   },
  Strategy:  { bg: 'var(--color-chart-bar)',  color: 'var(--color-danger)'  },
}

// ─── Month + week structure ───────────────────────────────────────────────────

const MONTHS = [
  {
    num:   1,
    label: 'Build the Foundation',
    days:  'Days 1–30',
    weeks: [
      { label: 'Week 1 — Shop Setup',         weeks: [1] },
      { label: 'Week 2 — First Design Batch', weeks: [2] },
      { label: 'Week 3 — First 4 Listings',   weeks: [3] },
      { label: 'Week 4 — Optimize + More',    weeks: [4] },
    ],
  },
  {
    num:   2,
    label: 'Build Volume',
    days:  'Days 31–60',
    weeks: [
      { label: 'Weeks 5–6 — Expand Beyond Florida', weeks: [5, 6] },
      { label: 'Weeks 7–8 — Bundle + More Cities',  weeks: [7, 8] },
    ],
  },
  {
    num:   3,
    label: 'Optimize & Expand',
    days:  'Days 61–90',
    weeks: [
      { label: 'Weeks 9–10 — Hit 20 Listings',        weeks: [9, 10]  },
      { label: 'Weeks 11–12 — Second Platform + Email', weeks: [11, 12] },
    ],
  },
]

const ROMAN = ['I', 'II', 'III']

// ─── Task row ─────────────────────────────────────────────────────────────────

function SsTaskRow({ task, onToggle }) {
  const tag = TAG_STYLES[task.tag] || TAG_STYLES.Design
  return (
    <div style={tr.row} onClick={onToggle} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onToggle()}>
      <div style={{
        ...tr.checkbox,
        background:   task.done ? 'var(--color-success)' : 'var(--color-bg)',
        borderColor:  task.done ? 'var(--color-success)' : 'var(--color-border)',
      }}>
        {task.done && <span style={tr.check}>✓</span>}
      </div>
      <span style={{
        ...tr.text,
        color:          task.done ? 'var(--color-faint)' : 'var(--color-muted)',
        textDecoration: task.done ? 'line-through' : 'none',
      }}>
        {task.text}
      </span>
      <span style={{ ...tr.tag, background: tag.bg, color: tag.color }}>
        {task.tag}
      </span>
    </div>
  )
}

const tr = {
  row:      { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 16px', cursor: 'pointer' },
  checkbox: { width: '15px', height: '15px', borderRadius: '4px', border: '1px solid', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s, border-color 0.15s' },
  check:    { fontSize: '9px', color: '#fff', lineHeight: 1, fontWeight: 700 },
  text:     { flex: 1, fontSize: '11px', lineHeight: 1.4, transition: 'color 0.15s' },
  tag:      { flexShrink: 0, fontSize: '9px', fontWeight: 600, padding: '2px 7px', borderRadius: '20px', letterSpacing: '0.04em' },
}

// ─── Month card ───────────────────────────────────────────────────────────────

function MonthCard({ month, tasks, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  const { ssDispatch } = useApp()

  const monthTasks  = tasks.filter(t => t.month === month.num)
  const donePct     = monthTasks.length
    ? Math.round((monthTasks.filter(t => t.done).length / monthTasks.length) * 100)
    : 0

  return (
    <div style={mc.card}>
      {/* Header */}
      <button style={mc.header} onClick={() => setOpen(o => !o)}>
        <div style={mc.numCircle}>
          <span style={mc.roman}>{ROMAN[month.num - 1]}</span>
        </div>
        <div style={mc.meta}>
          <span style={mc.tag}>{month.days}</span>
          <span style={mc.title}>{month.label}</span>
        </div>
        <div style={mc.right}>
          <span style={mc.pct}>{donePct}%</span>
          <span style={{ ...mc.chevron, transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
        </div>
      </button>

      {/* Body */}
      {open && (
        <div style={mc.body}>
          {month.weeks.map(wb => {
            const wbTasks = monthTasks.filter(t => wb.weeks.includes(t.week))
            if (!wbTasks.length) return null
            return (
              <div key={wb.label}>
                <p style={mc.weekLabel}>{wb.label.toUpperCase()}</p>
                {wbTasks.map(task => (
                  <SsTaskRow
                    key={task.id}
                    task={task}
                    onToggle={() => ssDispatch({ type: 'TOGGLE_SS_TASK', payload: task.id })}
                  />
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const mc = {
  card:      { background: 'var(--color-card)', border: 'var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '10px' },
  header:    { width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' },
  numCircle: { width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-accent-bg)', border: '0.5px solid var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  roman:     { fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)', lineHeight: 1 },
  meta:      { flex: 1, display: 'flex', flexDirection: 'column', gap: '1px', alignItems: 'flex-start' },
  tag:       { fontSize: '9px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)' },
  title:     { fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.2 },
  right:     { display: 'flex', alignItems: 'center', gap: '8px' },
  pct:       { fontSize: '12px', fontWeight: 600, color: 'var(--color-accent)' },
  chevron:   { fontSize: '18px', color: 'var(--color-faint)', transition: 'transform 0.2s', lineHeight: 1 },
  body:      { borderTop: 'var(--border)' },
  weekLabel: { fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-accent)', padding: '12px 16px 4px', margin: 0 },
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SheStitches({ onBack }) {
  const { ssState, ssDoneCount, ssTotalCount, ssListingsCount, ssDayOf90 } = useApp()

  const pct = ssTotalCount ? Math.round((ssDoneCount / ssTotalCount) * 100) : 0

  return (
    <div style={s.screen}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={s.header}>
        <button style={s.back} onClick={onBack}>← Home</button>
        <h1 style={s.title}>
          She <span style={{ color: 'var(--color-accent)' }}>Stitches</span>
        </h1>
        <p style={s.subtitle}>90-DAY LAUNCH ROADMAP</p>
      </div>

      {/* ── Progress card ──────────────────────────────────────────────── */}
      <div style={s.cardWrap}>
        <div style={s.topEdge} />
        <div style={s.card}>
          {/* Stats row */}
          <div style={s.statsRow}>
            <div style={s.stat}>
              <span style={s.statNum}>{ssDoneCount}</span>
              <span style={s.statLabel}>TASKS DONE</span>
            </div>
            <div style={s.divider} />
            <div style={s.stat}>
              <span style={s.statNum}>{ssListingsCount}</span>
              <span style={s.statLabel}>LISTINGS LIVE</span>
            </div>
            <div style={s.divider} />
            <div style={s.stat}>
              <span style={s.statNum}>{ssDayOf90}</span>
              <span style={s.statLabel}>DAY OF 90</span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={s.progressWrap}>
            <div style={s.progressLabels}>
              <span style={s.progressLeft}>Overall progress</span>
              <span style={s.progressRight}>{pct}%</span>
            </div>
            <div style={s.track}>
              <div style={{ ...s.fill, width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Month sections ─────────────────────────────────────────────── */}
      <div style={s.months}>
        {MONTHS.map((month, i) => (
          <MonthCard
            key={month.num}
            month={month}
            tasks={ssState.tasks}
            defaultOpen={i === 0}
          />
        ))}
      </div>

      {/* ── Weekly Rhythm card ─────────────────────────────────────────── */}
      <div style={s.cardWrap}>
        <div style={s.topEdge} />
        <div style={{ ...s.card, padding: '16px' }}>
          <h3 style={s.rhythmTitle}>Weekly Rhythm</h3>
          <p style={s.rhythmSub}>7–10 HOURS PER WEEK</p>
          <div style={s.rhythmGrid}>
            {[
              { label: 'Design', hours: '3–4h', desc: 'New patterns' },
              { label: 'Listing', hours: '1–2h', desc: 'Publish + tag' },
              { label: 'Pinterest', hours: '1h', desc: 'Pin & repin' },
              { label: 'Admin', hours: '1h', desc: 'Stats + tweaks' },
            ].map(r => (
              <div key={r.label} style={s.rhythmBlock}>
                <span style={s.rhythmLabel}>{r.label}</span>
                <span style={s.rhythmHours}>{r.hours}</span>
                <span style={s.rhythmDesc}>{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── The One Rule card ──────────────────────────────────────────── */}
      <div style={{ ...s.cardWrap, marginBottom: '0' }}>
        <div style={s.topEdge} />
        <div style={{ ...s.card, padding: '16px' }}>
          <p style={s.ruleEyebrow}>🪡 The One Rule</p>
          <p style={s.ruleText}>
            No new platforms, no pivots for 90 days. Just execute the next task on this list.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  screen: {
    minHeight:     '100dvh',
    background:    'var(--color-bg)',
    paddingTop:    'var(--safe-top)',
    paddingBottom: 'calc(var(--safe-bottom) + var(--space-10))',
    display:       'flex',
    flexDirection: 'column',
  },

  // Header
  header: {
    padding: '12px 20px 16px',
  },
  back: {
    fontSize:   '14px',
    color:      'var(--color-muted)',
    background: 'none',
    border:     'none',
    cursor:     'pointer',
    padding:    '0 0 10px',
    display:    'block',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontStyle:  'italic',
    fontSize:   '36px',
    lineHeight: 1,
    color:      'var(--color-text)',
    margin:     '0 0 4px',
  },
  subtitle: {
    fontSize:      '9px',
    fontWeight:    700,
    letterSpacing: '0.12em',
    color:         'var(--color-muted)',
    margin:        0,
  },

  // Progress / rule cards
  cardWrap: {
    margin:       '0 20px 14px',
    borderRadius: '12px',
    overflow:     'hidden',
    border:       'var(--border)',
  },
  topEdge: {
    height:     '2px',
    background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-light))',
  },
  card: {
    background: 'var(--color-card)',
    padding:    '14px 16px',
  },

  // Stats
  statsRow: {
    display:       'flex',
    alignItems:    'center',
    marginBottom:  '14px',
  },
  stat: {
    flex:          1,
    display:       'flex',
    flexDirection: 'column',
    alignItems:    'center',
    gap:           '2px',
  },
  statNum: {
    fontFamily: 'var(--font-display)',
    fontSize:   '24px',
    color:      'var(--color-accent)',
    lineHeight: 1,
  },
  statLabel: {
    fontSize:      '9px',
    fontWeight:    700,
    letterSpacing: '0.08em',
    color:         'var(--color-muted)',
  },
  divider: {
    width:      '0.5px',
    height:     '32px',
    background: 'var(--color-border)',
    flexShrink: 0,
  },

  // Progress bar
  progressWrap: {},
  progressLabels: {
    display:        'flex',
    justifyContent: 'space-between',
    marginBottom:   '6px',
  },
  progressLeft:  { fontSize: '11px', color: 'var(--color-muted)' },
  progressRight: { fontSize: '11px', fontWeight: 600, color: 'var(--color-accent)' },
  track: {
    height:       '3px',
    background:   'var(--color-faint)',
    borderRadius: 'var(--radius-pill)',
    overflow:     'hidden',
  },
  fill: {
    height:     '100%',
    background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-light))',
    borderRadius: 'var(--radius-pill)',
    transition: 'width 0.4s ease',
  },

  // Month cards
  months: {
    padding: '0 20px',
    flex:    1,
  },

  // Rhythm card
  rhythmTitle: {
    fontFamily: 'var(--font-display)',
    fontStyle:  'italic',
    fontSize:   '20px',
    color:      'var(--color-text)',
    margin:     '0 0 2px',
  },
  rhythmSub: {
    fontSize:      '9px',
    fontWeight:    700,
    letterSpacing: '0.1em',
    color:         'var(--color-muted)',
    margin:        '0 0 12px',
  },
  rhythmGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap:                 '8px',
  },
  rhythmBlock: {
    background:    'var(--color-chart-bar)',
    borderRadius:  '8px',
    padding:       '10px 12px',
    display:       'flex',
    flexDirection: 'column',
    gap:           '2px',
  },
  rhythmLabel: { fontSize: '10px', fontWeight: 600, color: 'var(--color-accent)', letterSpacing: '0.04em' },
  rhythmHours: { fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-text)', lineHeight: 1 },
  rhythmDesc:  { fontSize: '10px', color: 'var(--color-faint)' },

  // One Rule
  ruleEyebrow: { fontSize: '11px', fontWeight: 600, color: 'var(--color-accent)', margin: '0 0 6px' },
  ruleText:    { fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '15px', color: 'var(--color-text)', lineHeight: 1.5, margin: 0 },
}
