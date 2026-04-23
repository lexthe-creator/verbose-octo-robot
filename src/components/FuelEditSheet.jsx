import { useState, useEffect } from 'react'

export default function FuelEditSheet({ meal, onClose, onSave }) {
  const [visible, setVisible] = useState(false)
  const [start, setStart] = useState(meal.startTime)
  const [end,   setEnd]   = useState(meal.endTime)

  // Mount-trigger slide-up animation
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  function handleSave() {
    setVisible(false)
    setTimeout(() => onSave(start, end), 250)
  }

  return (
    <div
      style={{
        ...s.backdrop,
        opacity:       visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          ...s.sheet,
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={s.header}>{meal.label} window</h3>

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
          <button style={s.saveBtn}   onClick={handleSave}>Save window</button>
          <button style={s.cancelBtn} onClick={handleClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

const s = {
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
  sheet: {
    width:                '100%',
    maxWidth:             'var(--max-width)',
    background:           '#1E1E18',
    borderTopLeftRadius:  '20px',
    borderTopRightRadius: '20px',
    padding:              '24px',
    paddingBottom:        'calc(24px + var(--safe-bottom))',
    transition:           'transform 250ms var(--ease-out)',
    display:              'flex',
    flexDirection:        'column',
    gap:                  '16px',
  },
  header: {
    fontFamily: 'var(--font-display)',
    fontSize:   '20px',
    color:      'var(--color-text)',
    lineHeight: 1.2,
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
    color:         '#3A3A30',
  },
  input: {
    background:   '#252520',
    border:       '0.5px solid #2A2A22',
    color:        '#F6F3EF',
    height:       '44px',
    borderRadius: '10px',
    padding:      '0 12px',
    fontFamily:   'var(--font-body)',
    fontSize:     '15px',
    colorScheme:  'dark',
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
