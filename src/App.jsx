import { useState } from 'react'
import { useApp } from './context/AppContext.jsx'

import MorningIgnition from './screens/MorningIgnition.jsx'
import Home            from './screens/Home.jsx'
import FocusTimer      from './screens/FocusTimer.jsx'
import Inbox           from './screens/Inbox.jsx'
import Finance         from './screens/Finance.jsx'
import SheStitches     from './screens/SheStitches.jsx'

const NAV_TABS = [
  { id: 'home',    label: 'Home',    icon: '⌂' },
  { id: 'inbox',   label: 'Inbox',   icon: '◎' },
  { id: 'finance', label: 'Finance', icon: '◈' },
]

export default function App() {
  const { state } = useApp()

  const [screen, setScreen] = useState(() => {
    if (!state.dayLockedAt) return 'ignition'
    const lockedDate = new Date(state.dayLockedAt).toDateString()
    return lockedDate === new Date().toDateString() ? 'home' : 'ignition'
  })

  function navigate(target) {
    setScreen(target)
  }

  const hideNav = screen === 'ignition' || screen === 'focus' || screen === 'shestitches'

  return (
    <div style={styles.root}>
      <div style={{ ...styles.screenWrap, paddingBottom: hideNav ? 0 : 'var(--nav-height)' }}>
        {screen === 'ignition' && (
          <MorningIgnition onComplete={() => navigate('home')} />
        )}
        {screen === 'home' && (
          <Home
            onOpenFocus={() => navigate('focus')}
            onOpenInbox={() => navigate('inbox')}
            onNavigate={navigate}
          />
        )}
        {screen === 'shestitches' && (
          <SheStitches onBack={() => navigate('home')} />
        )}
        {screen === 'focus' && (
          <FocusTimer onClose={() => navigate('home')} />
        )}
        {screen === 'inbox' && <Inbox />}
        {screen === 'finance' && <Finance />}
      </div>

      {!hideNav && (
        <nav style={styles.nav}>
          {NAV_TABS.map(tab => {
            const active = screen === tab.id
            return (
              <button
                key={tab.id}
                style={styles.tab}
                onClick={() => navigate(tab.id)}
                aria-label={tab.label}
              >
                <span style={{ ...styles.tabIcon, color: active ? 'var(--color-accent)' : 'var(--color-muted)' }}>
                  {tab.icon}
                </span>
                <span style={{ ...styles.tabLabel, color: active ? 'var(--color-accent)' : 'var(--color-muted)' }}>
                  {tab.label}
                </span>
                {active && <span style={styles.pip} />}
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}

const styles = {
  root: {
    display:        'flex',
    flexDirection:  'column',
    width:          '100%',
    maxWidth:       'var(--max-width)',
    minHeight:      '100dvh',
    background:     'var(--color-bg)',
    position:       'relative',
  },
  screenWrap: {
    flex:      1,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  nav: {
    display:         'flex',
    alignItems:      'stretch',
    justifyContent:  'space-around',
    height:          'var(--nav-height)',
    paddingBottom:   'var(--safe-bottom)',
    background:      'var(--color-nav-bg)',
    borderTop:       'var(--border)',
    position:        'fixed',
    bottom:          0,
    left:            '50%',
    transform:       'translateX(-50%)',
    width:           '100%',
    maxWidth:        'var(--max-width)',
    zIndex:          100,
  },
  tab: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '2px',
    flex:           1,
    position:       'relative',
    background:     'none',
    border:         'none',
    cursor:         'pointer',
    paddingBottom:  '6px',
  },
  tabIcon: {
    fontSize:   '20px',
    lineHeight: 1,
  },
  tabLabel: {
    fontSize:      '10px',
    fontWeight:    500,
    letterSpacing: '0.02em',
  },
  pip: {
    position:     'absolute',
    bottom:       '6px',
    left:         '50%',
    transform:    'translateX(-50%)',
    width:        '4px',
    height:       '4px',
    borderRadius: '50%',
    background:   'var(--color-accent)',
  },
}
