import { useCallback, useEffect, useId, useRef, useState } from 'react'

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

export function PlannerSwipeRow({
  mode = 'confirm',
  direction = 'right',
  threshold = 80,
  revealWidth = 72,
  revealThresholdRatio = 0.6,
  autoActionThreshold = 180,
  enableAutoAction = false,
  inputMode = 'touch-and-mouse',
  completed = false,
  disabled = false,
  actionLabel = 'Confirm',
  revealActionLabel = 'Delete',
  skipLabel = 'Skip',
  hintLabel = 'swipe ->',
  onAction,
  onRevealAction,
  onSkip,
  renderAction,
  children,
  style,
  contentStyle,
  revealStyle,
  actionStyle,
}) {
  const [offset, setOffset] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const startXRef = useRef(null)
  const offsetRef = useRef(0)
  const activePointerRef = useRef(null)
  const autoActionCommittedRef = useRef(false)

  const normalizedDirection = direction === 'left' ? 'left' : 'right'
  const normalizedMode = ['confirm', 'remove', 'reveal-delete', 'immediate-delete'].includes(mode)
    ? mode
    : 'confirm'
  const isRevealMode = normalizedMode === 'reveal-delete'
  const canDrag = !completed && !disabled
  const maxOffset = isRevealMode ? revealWidth : Math.max(threshold, revealWidth)
  const revealedOffset = normalizedDirection === 'left' ? -revealWidth : revealWidth
  const releaseThreshold = isRevealMode
    ? Math.max(1, revealWidth * revealThresholdRatio)
    : threshold

  const commitAction = useCallback(() => {
    if (disabled) return
    onAction?.()
  }, [disabled, onAction])

  const commitRevealAction = useCallback(() => {
    if (disabled) return
    onRevealAction?.()
  }, [disabled, onRevealAction])

  function setSwipeOffset(nextOffset) {
    offsetRef.current = nextOffset
    setOffset(nextOffset)
  }

  function getDirectionalOffset(clientX) {
    if (startXRef.current === null) return 0
    const rawDelta = clientX - startXRef.current
    const directionalDelta = normalizedDirection === 'left'
      ? Math.min(0, rawDelta)
      : Math.max(0, rawDelta)
    const boundedMagnitude = Math.min(maxOffset, Math.abs(directionalDelta))
    return normalizedDirection === 'left' ? -boundedMagnitude : boundedMagnitude
  }

  function resetSwipe() {
    startXRef.current = null
    activePointerRef.current = null
    setSwiping(false)
  }

  function startSwipe(clientX, pointerId) {
    if (!canDrag) return
    startXRef.current = clientX
    activePointerRef.current = pointerId
    autoActionCommittedRef.current = false
    setSwiping(true)
    if (!isRevealMode) setRevealed(false)
  }

  function updateSwipe(clientX) {
    if (!canDrag || startXRef.current === null) return
    const nextOffset = getDirectionalOffset(clientX)
    const magnitude = Math.abs(nextOffset)
    setSwipeOffset(nextOffset)

    if (enableAutoAction && !autoActionCommittedRef.current && magnitude >= autoActionThreshold) {
      autoActionCommittedRef.current = true
      if (isRevealMode) commitRevealAction()
      else commitAction()
    }
  }

  function finishSwipe() {
    if (!canDrag) {
      resetSwipe()
      return
    }

    const magnitude = Math.abs(offsetRef.current)
    if (isRevealMode) {
      if (magnitude >= releaseThreshold) {
        setRevealed(true)
        setSwipeOffset(revealedOffset)
      } else {
        setRevealed(false)
        setSwipeOffset(0)
      }
    } else if (magnitude >= releaseThreshold) {
      commitAction()
      setSwipeOffset(0)
    } else {
      setSwipeOffset(0)
    }

    resetSwipe()
  }

  function handlePointerDown(event) {
    if (!canDrag) return
    if (inputMode === 'touch-only' && event.pointerType === 'mouse') return
    if (inputMode === 'mouse-only' && event.pointerType !== 'mouse') return
    startSwipe(event.clientX, event.pointerId)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function handlePointerMove(event) {
    if (activePointerRef.current !== event.pointerId) return
    updateSwipe(event.clientX)
  }

  function handlePointerUp(event) {
    if (activePointerRef.current !== event.pointerId) return
    finishSwipe()
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  function handlePointerCancel(event) {
    if (activePointerRef.current !== event.pointerId) return
    setSwipeOffset(revealed ? revealedOffset : 0)
    resetSwipe()
  }

  function revealForKeyboard() {
    if (!isRevealMode) return
    setRevealed(true)
    setSwipeOffset(revealedOffset)
  }

  function handleKeyDown(event) {
    if (disabled || completed) return

    if (event.key === 'Escape' && isRevealMode && revealed) {
      event.preventDefault()
      setRevealed(false)
      setSwipeOffset(0)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (isRevealMode) {
        if (revealed) commitRevealAction()
        else revealForKeyboard()
      } else {
        commitAction()
      }
      return
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      if (isRevealMode) {
        if (revealed) commitRevealAction()
        else revealForKeyboard()
      } else if (normalizedMode === 'remove' || normalizedMode === 'immediate-delete') {
        commitAction()
      }
    }
  }

  const progress = Math.min(Math.abs(offset) / Math.max(1, releaseThreshold), 1)
  const actionContext = {
    progress,
    revealed,
    completed,
    disabled,
    mode: normalizedMode,
    direction: normalizedDirection,
  }
  const renderedChildren = typeof children === 'function' ? children(actionContext) : children
  const renderedAction = renderAction?.(actionContext)
  const accessibleLabel = isRevealMode && revealed ? revealActionLabel : actionLabel

  return (
    <div
      aria-disabled={disabled || undefined}
      aria-label={accessibleLabel}
      data-planner-swipe-mode={normalizedMode}
      data-planner-swipe-revealed={revealed ? 'true' : 'false'}
      onKeyDown={handleKeyDown}
      role="group"
      style={{ ...styles.swipeWrap, ...style }}
      tabIndex={disabled ? -1 : 0}
    >
      {isRevealMode && (
        <button
          aria-label={revealActionLabel}
          disabled={disabled}
          onClick={commitRevealAction}
          style={{
            ...styles.swipeRevealAction,
            ...(normalizedDirection === 'left' ? { right: 0 } : { left: 0 }),
            width: `${revealWidth}px`,
            ...revealStyle,
          }}
          type="button"
        >
          {revealActionLabel}
        </button>
      )}

      <div
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          ...styles.swipeContent,
          transform: `translateX(${offset}px)`,
          transition: swiping ? 'none' : 'transform 0.25s var(--ease-out)',
          ...contentStyle,
        }}
      >
        {renderedChildren}
      </div>

      <span aria-hidden="true" style={styles.swipeHint}>{hintLabel}</span>

      {!isRevealMode && (
        <button
          aria-label={actionLabel}
          disabled={disabled || completed}
          onClick={commitAction}
          style={styles.visuallyHiddenAction}
          type="button"
        >
          {actionLabel}
        </button>
      )}

      {isRevealMode && (
        <button
          aria-label={revealActionLabel}
          disabled={disabled}
          onClick={commitRevealAction}
          style={styles.visuallyHiddenAction}
          type="button"
        >
          {revealActionLabel}
        </button>
      )}

      {onSkip && (
        <button
          aria-label={skipLabel}
          disabled={disabled}
          onClick={onSkip}
          style={styles.visuallyHiddenAction}
          type="button"
        >
          {skipLabel}
        </button>
      )}

      {renderedAction && (
        <div aria-hidden="true" style={{ ...styles.swipeActionSlot, ...actionStyle }}>
          {renderedAction}
        </div>
      )}
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
  swipeWrap: {
    position:    'relative',
    overflow:    'hidden',
    userSelect:  'none',
    touchAction: 'pan-y',
    outline:     'none',
  },
  swipeContent: {
    position:    'relative',
    zIndex:      1,
    touchAction: 'pan-y',
  },
  swipeRevealAction: {
    position:       'absolute',
    top:            0,
    bottom:         0,
    zIndex:         0,
    border:         'none',
    background:     'transparent',
    color:          'var(--color-danger)',
    fontFamily:     'var(--font-body)',
    fontSize:       '12px',
    fontWeight:     700,
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
  },
  swipeHint: {
    position:      'absolute',
    width:         '1px',
    height:        '1px',
    padding:       0,
    margin:        '-1px',
    overflow:      'hidden',
    clip:          'rect(0, 0, 0, 0)',
    whiteSpace:    'nowrap',
    border:        0,
  },
  swipeActionSlot: {
    position:      'absolute',
    top:           0,
    right:         0,
    bottom:        0,
    zIndex:        2,
    pointerEvents: 'none',
  },
  visuallyHiddenAction: {
    position:   'absolute',
    width:      '1px',
    height:     '1px',
    padding:    0,
    margin:     '-1px',
    overflow:   'hidden',
    clip:       'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border:     0,
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
