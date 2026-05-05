import { useState, useEffect } from 'react'
import { useApp } from './context/AppContext.jsx'

import MorningIgnition from './screens/MorningIgnition.jsx'
import Home            from './screens/Home.jsx'
import FocusTimer      from './screens/FocusTimer.jsx'
import Inbox           from './screens/Inbox.jsx'
import Finance         from './screens/Finance.jsx'
import Projects        from './screens/Projects.jsx'
import Settings        from './screens/Settings.jsx'
import Fitness         from './screens/Fitness.jsx'
import WorkoutPlayer   from './components/WorkoutPlayer.jsx'
import EodReflection   from './screens/EodReflection.jsx'
import WeeklyPlanning  from './screens/WeeklyPlanning.jsx'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function isThisWeek(dateStr) {
  if (!dateStr) return false
  const d   = new Date(dateStr)
  const now = new Date()
  const day = now.getDay()
  const diffToMon = day === 0 ? -6 : 1 - day
  const mon = new Date(now)
  mon.setDate(now.getDate() + diffToMon)
  mon.setHours(0, 0, 0, 0)
  const nextMon = new Date(mon)
  nextMon.setDate(mon.getDate() + 7)
  return d >= mon && d < nextMon
}

const NAV_TABS = [
  { id: 'home',     label: 'Home',     icon: '⌂' },
  { id: 'fitness',  label: 'Fitness',  icon: '◉' },
  { id: 'inbox',    label: 'Inbox',    icon: '◎' },
  { id: 'projects', label: 'Projects', icon: '◧' },
  { id: 'finance',  label: 'Finance',  icon: '◈' },
]

export default function App() {
  const { state, dispatch } = useApp()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.settings.theme || 'dark')
  }, [state.settings.theme])

  const [screen, setScreen] = useState(() => {
    if (!state.dayLockedAt) return 'ignition'
    const lockedDate = new Date(state.dayLockedAt).toDateString()
    return lockedDate === new Date().toDateString() ? 'home' : 'ignition'
  })

  const [activeWorkout, setActiveWorkout] = useState(null)

  const [showReflection, setShowReflection] = useState(() => {
    if (new URLSearchParams(window.location.search).get('eod') === '1') return true
    const h    = new Date().getHours()
    const last = localStorage.getItem('lastReflectionDate')
    return h >= 19 && last !== todayStr()
  })

  const [showWeeklyPlan, setShowWeeklyPlan] = useState(() => {
    if (new URLSearchParams(window.location.search).get('weekly') === '1') return true
    const now  = new Date()
    const last = localStorage.getItem('lastWeeklyPlanDate')
    return now.getDay() === 0 && now.getHours() >= 17 && !isThisWeek(last)
  })

  function navigate(target) {
    if (target === 'eod')    { setShowReflection(true);  return }
    if (target === 'weekly') { setShowWeeklyPlan(true);  return }
    setScreen(target)
  }

  function handleStartWorkout(workout) {
    setActiveWorkout(workout)
  }

  function handleWorkoutComplete(log) {
    dispatch({ type: 'LOG_WORKOUT', payload: log })
    setActiveWorkout(null)
  }

  const hideNav = (
    screen === 'ignition' ||
    screen === 'focus'    ||
    screen === 'settings'
  )

  return (
    <div style={styles.root}>
      <div style={{ ...styles.screenWrap, paddingBottom: hideNav ? 0 : 'var(--nav-height)' }}>
        {screen === 'ignition' && (
          <MorningIgnition onComplete={() => navigate('home')} />
        )}
        {screen === 'home' && (
          <Home
            onOpenFocus={() => navigate('focus')}
            onNavigate={navigate}
            onStartWorkout={handleStartWorkout}
          />
        )}
        {screen === 'fitness' && (
          <Fitness onStartWorkout={handleStartWorkout} />
        )}
        {screen === 'settings' && (
          <Settings onBack={() => navigate('home')} />
        )}
        {screen === 'projects' && (
          <Projects onBack={() => navigate('home')} />
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

      {/* EOD Reflection — shows after 7pm if not logged today; priority over weekly plan */}
      {showReflection && screen !== 'ignition' && screen !== 'focus' && (
        <EodReflection
          onComplete={() => {
            localStorage.setItem('lastReflectionDate', todayStr())
            setShowReflection(false)
          }}
        />
      )}

      {/* Sunday Weekly Planning — shows Sunday ≥5pm if not planned this week */}
      {showWeeklyPlan && !showReflection && screen !== 'ignition' && (
        <WeeklyPlanning
          onComplete={() => {
            localStorage.setItem('lastWeeklyPlanDate', todayStr())
            setShowWeeklyPlan(false)
          }}
        />
      )}

      {activeWorkout && (
        <WorkoutPlayer
          workout={activeWorkout}
          onComplete={handleWorkoutComplete}
          onClose={() => setActiveWorkout(null)}
        />
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
