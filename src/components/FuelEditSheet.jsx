import { useState } from 'react'
import { PlannerBottomSheet } from './planner/PlannerPrimitives.jsx'

export default function FuelEditSheet({ meal, onClose, onSave }) {
  const [start, setStart] = useState(meal.startTime)
  const [end,   setEnd]   = useState(meal.endTime)

  return (
    <PlannerBottomSheet
      animated
      closeDelayMs={250}
      closeOnBackdrop
      onClose={onClose}
      title={`${meal.label} window`}
      zIndex={200}
      backdropStyle={s.backdrop}
      sheetStyle={s.sheet}
      headerStyle={s.headerWrap}
      titleStyle={s.header}
      closeStyle={s.hiddenClose}
    >
      {({ close }) => (
        <>
          <div style={s.fieldGroup}>
            <label style={s.label}>Start time</label>
            <input
              type="time"
              style={s.input}
              value={start}
              onChange={e => setStart(e.target.value)}
            />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>End time</label>
            <input
              type="time"
              style={s.input}
              value={end}
              onChange={e => setEnd(e.target.value)}
            />
          </div>

          <div style={s.actions}>
            <button style={s.saveBtn} onClick={() => close(() => onSave(start, end))} type="button">Save window</button>
            <button style={s.cancelBtn} onClick={() => close()} type="button">Cancel</button>
          </div>
        </>
      )}
    </PlannerBottomSheet>
  )
}

const s = {
  backdrop: {
    background:     'rgba(0,0,0,0.6)',
  },
  sheet: {
    width:                '100%',
    maxWidth:             'var(--max-width)',
    maxHeight:            'none',
    overflowY:            'visible',
    background:           'var(--color-card)',
    borderTop:            'none',
    borderTopLeftRadius:  '20px',
    borderTopRightRadius: '20px',
    padding:              '24px',
    paddingBottom:        'calc(24px + var(--safe-bottom))',
    display:              'flex',
    flexDirection:        'column',
    gap:                  '16px',
    boxShadow:            'none',
  },
  headerWrap: {
    display:      'block',
    marginBottom: 0,
  },
  header: {
    marginBlockStart: '1em',
    marginBlockEnd:   '1em',
    fontFamily: 'var(--font-display)',
    fontSize:   '20px',
    fontWeight: 'bold',
    color:      'var(--color-text)',
    lineHeight: 1.2,
  },
  hiddenClose: {
    display: 'none',
  },
  fieldGroup: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '6px',
  },
  label: {
    fontSize:      '10px',
    fontWeight:    600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color:         'var(--color-faint)',
  },
  input: {
    background:   'var(--color-chart-bar)',
    border:       'var(--border)',
    color:        'var(--color-text)',
    height:       '44px',
    borderRadius: '10px',
    padding:      '0 12px',
    fontFamily:   'var(--font-body)',
    fontSize:     '15px',
    outline:      'none',
    width:        '100%',
  },
  actions: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '8px',
    marginTop:     '8px',
  },
  saveBtn: {
    width:        '100%',
    padding:      '14px',
    borderRadius: '12px',
    background:   'var(--color-accent)',
    color:        '#fff',
    fontSize:     '15px',
    fontWeight:   600,
    border:       'none',
    cursor:       'pointer',
  },
  cancelBtn: {
    width:      '100%',
    padding:    '14px',
    borderRadius: '12px',
    background: 'transparent',
    color:      'var(--color-muted)',
    fontSize:   '15px',
    fontWeight: 500,
    border:     'none',
    cursor:     'pointer',
  },
}
