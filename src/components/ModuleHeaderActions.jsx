import { SCREENS } from '../constants/navigation.js'

function InboxIcon() {
  return (
    <svg style={styles.svg} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6.5h16v11H4z" />
      <path d="m4 8 8 5 8-5" />
      <path d="M4 17.5h16" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg style={styles.svg} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.25" />
      <path d="M12 3.5v2.25M12 18.25v2.25M4.65 7.75l1.95 1.12M17.4 15.13l1.95 1.12M4.65 16.25l1.95-1.12M17.4 8.87l1.95-1.12" />
    </svg>
  )
}

export default function ModuleHeaderActions({ onNavigate, offset = 'default' }) {
  const top = offset === 'belowHeader'
    ? 'calc(var(--safe-top) + 56px)'
    : 'calc(var(--safe-top) + 12px)'

  return (
    <div style={{ ...styles.wrap, top }}>
      <button
        style={styles.iconBtn}
        onClick={() => onNavigate(SCREENS.INBOX)}
        aria-label="Inbox"
        type="button"
      >
        <InboxIcon />
      </button>
      <button
        style={styles.iconBtn}
        onClick={() => onNavigate(SCREENS.SETTINGS)}
        aria-label="Settings"
        type="button"
      >
        <SettingsIcon />
      </button>
    </div>
  )
}

const styles = {
  wrap: {
    position:       'fixed',
    right:          'max(20px, var(--safe-right), calc((100vw - var(--max-width)) / 2 + 20px))',
    zIndex:         90,
    display:        'flex',
    gap:            '8px',
    pointerEvents:  'auto',
  },
  iconBtn: {
    width:          '30px',
    height:         '30px',
    borderRadius:   '50%',
    border:         '0.5px solid color-mix(in srgb, var(--color-border) 62%, transparent)',
    background:     'color-mix(in srgb, var(--color-bg) 88%, transparent)',
    color:          'var(--color-muted)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
    backdropFilter: 'blur(8px)',
  },
  svg: {
    width:       '15px',
    height:      '15px',
    display:     'block',
    fill:        'none',
    stroke:      'currentColor',
    strokeWidth: 1.8,
    strokeLinecap:'round',
    strokeLinejoin:'round',
  },
}
