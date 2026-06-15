import { useCallback, useEffect, useId, useState } from 'react'

export function PlannerRow({ label, value, detail, percent }) {
  const detailIsLong = typeof detail === 'string' && detail.length > 18

  return (
    <div style={styles.row}>
      <span style={styles.rowLabel}>{label}</span>
      <span style={styles.rowValue}>{value}</span>
      {detail && (
        <span style={{ ...styles.rowDetail, ...(detailIsLong ? styles.rowDetailLong : {}) }}>
          {detail}
        </span>
      )}
      {typeof percent === 'number' && (
        <span style={styles.meter}>
          <span style={{ ...styles.meterFill, width: `${percent}%` }} />
        </span>
      )}
    </div>
  )
}

export function PlannerSectionHeader({ eyebrow, title }) {
  return (
    <div style={styles.sectionHeader}>
      <p style={styles.eyebrow}>{eyebrow}</p>
      <h2 style={styles.sectionTitle}>{title}</h2>
    </div>
  )
}

export function PlannerActionButton({ children, onClick, disabled, secondary = false }) {
  return (
    <button
      style={{ ...styles.action, ...(secondary ? styles.secondaryAction : {}), opacity: disabled ? 0.44 : 1 }}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  )
}

export function PlannerActionRow({ children, style }) {
  return <div style={{ ...styles.inlineActions, ...style }}>{children}</div>
}

export function PlannerBottomSheet({
  title,
  children,
  onClose,
  animated = false,
  closeDelayMs = 250,
  closeOnBackdrop = false,
  closeOnEscape = false,
  zIndex,
  backdropStyle,
  sheetStyle,
  headerStyle,
  titleStyle,
  closeStyle,
}) {
  const titleId = useId()
  const [closing, setClosing] = useState(false)

  const close = useCallback((afterClose = onClose) => {
    if (animated) {
      if (closing) return
      setClosing(true)
      window.setTimeout(afterClose, closeDelayMs)
      return
    }

    afterClose()
  }, [animated, closeDelayMs, closing, onClose])

  useEffect(() => {
    if (!closeOnEscape) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') close()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [close, closeOnEscape])

  const renderedChildren = typeof children === 'function' ? children({ close }) : children

  const animatedBackdropStyle = animated ? {
    opacity:    closing ? 0 : 1,
    transition: `opacity ${closeDelayMs}ms ease`,
    animation:  closing ? undefined : `planner-sheet-backdrop-in ${closeDelayMs}ms ease`,
  } : null

  const animatedSheetStyle = animated ? {
    transform:  closing ? 'translateY(100%)' : 'translateY(0)',
    transition: `transform ${closeDelayMs}ms var(--ease-out)`,
    animation:  closing ? undefined : `planner-sheet-enter ${closeDelayMs}ms var(--ease-out)`,
  } : null

  return (
    <div
      onClick={closeOnBackdrop ? () => close() : undefined}
      style={{
        ...styles.sheetBackdrop,
        ...(zIndex ? { zIndex } : {}),
        ...animatedBackdropStyle,
        ...backdropStyle,
      }}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        onClick={event => event.stopPropagation()}
        role="dialog"
        style={{ ...styles.sheet, ...animatedSheetStyle, ...sheetStyle }}
      >
        <div style={{ ...styles.sheetHeader, ...headerStyle }}>
          <h2 id={titleId} style={{ ...styles.sheetTitle, ...titleStyle }}>{title}</h2>
          <button style={{ ...styles.closeButton, ...closeStyle }} onClick={() => close()} type="button">close</button>
        </div>
        {renderedChildren}
      </div>
    </div>
  )
}

export function PlannerOptionGrid({ options, value, onChange }) {
  return (
    <div style={styles.optionGrid}>
      {options.map(option => {
        const optionValue = typeof option === 'object' ? option.value : option
        const label = typeof option === 'object' ? option.label : `${option} days`
        const active = value === optionValue || value === option
        return (
          <button
            key={`${optionValue}-${label}`}
            style={{ ...styles.optionButton, ...(active ? styles.optionActive : {}) }}
            onClick={() => onChange(optionValue)}
            type="button"
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

const styles = {
  row: {
    display:             'grid',
    gridTemplateColumns: '76px minmax(0, 1fr) auto',
    alignItems:          'center',
    gap:                 '7px',
    minHeight:           '19px',
    padding:             '1px 0',
    borderTop:           'none',
  },
  rowLabel: {
    color:      'var(--color-muted)',
    fontSize:   '11px',
    fontWeight: 560,
  },
  rowValue: {
    minWidth:   0,
    color:      'var(--color-text)',
    fontSize:   '12px',
    fontWeight: 560,
    overflow:   'hidden',
    textOverflow:'ellipsis',
    whiteSpace: 'nowrap',
  },
  rowDetail: {
    color:      'var(--color-muted)',
    fontSize:   '10px',
    fontWeight: 520,
    whiteSpace: 'nowrap',
  },
  rowDetailLong: {
    gridColumn: '2 / 4',
    whiteSpace: 'normal',
    lineHeight: 1.3,
    marginTop:  '-2px',
  },
  meter: {
    gridColumn:   '2 / 4',
    height:       '3px',
    borderRadius: '999px',
    background:   'var(--color-chart-bar)',
    overflow:     'hidden',
  },
  meterFill: {
    display:      'block',
    height:       '100%',
    borderRadius: '999px',
    background:   'var(--color-accent)',
  },
  sectionHeader: {
    display:       'flex',
    flexDirection: 'column',
    gap:           0,
    marginBottom:  0,
  },
  eyebrow: {
    margin:        0,
    color:         'var(--color-muted)',
    fontSize:      '10px',
    fontWeight:    650,
    letterSpacing: '0',
    textTransform: 'lowercase',
  },
  sectionTitle: {
    margin:        0,
    fontFamily:    'var(--font-body)',
    fontSize:      '12px',
    fontWeight:    650,
    lineHeight:    1.1,
    textTransform: 'none',
  },
  inlineActions: {
    display:   'flex',
    flexWrap:  'wrap',
    gap:       '5px',
    marginTop: '2px',
  },
  action: {
    minHeight:    '22px',
    border:       'none',
    borderRadius: '999px',
    background:   'var(--color-accent)',
    color:        '#fff',
    fontSize:     '10px',
    fontWeight:   650,
    padding:      '3px 8px',
  },
  secondaryAction: {
    border:     'var(--border)',
    background: 'transparent',
    color:      'var(--color-text)',
  },
  sheetBackdrop: {
    position:       'fixed',
    inset:          0,
    zIndex:         180,
    display:        'flex',
    alignItems:     'flex-end',
    justifyContent: 'center',
    background:     'rgba(24, 24, 18, 0.22)',
  },
  sheet: {
    width:        '100%',
    maxWidth:     'var(--max-width)',
    maxHeight:    '82dvh',
    overflowY:    'auto',
    background:   'var(--color-bg)',
    borderTop:    'var(--border)',
    padding:      '16px 20px calc(var(--safe-bottom) + 18px)',
    boxShadow:    '0 -14px 38px rgba(24, 24, 18, 0.14)',
  },
  sheetHeader: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            '12px',
    marginBottom:   '10px',
  },
  sheetTitle: {
    margin:      0,
    fontFamily: 'var(--font-display)',
    fontSize:   '18px',
    fontWeight: 500,
  },
  closeButton: {
    border:     'none',
    background: 'transparent',
    color:      'var(--color-muted)',
    fontSize:   '12px',
    fontWeight: 750,
    padding:    '4px 0',
  },
  optionGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap:                 '6px',
  },
  optionButton: {
    minHeight:    '35px',
    border:       'var(--border)',
    borderRadius: '8px',
    background:   'transparent',
    color:        'var(--color-text)',
    fontSize:     '11px',
    fontWeight:   700,
    padding:      '7px 9px',
    textAlign:    'left',
  },
  optionActive: {
    borderColor: 'var(--color-accent)',
    background:  'var(--color-accent-bg)',
    color:       'var(--color-accent)',
  },
}
