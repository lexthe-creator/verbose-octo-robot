import { useState } from 'react'
import { useDay, useFitness } from './context/index.js'
import { SCREENS, NAV_TABS } from './constants/navigation.js'
import { shouldShowNav } from './navigation/router.js'
import { useNavigate } from './navigation/useNavigate.js'
import { getTodayISO, isThisWeek } from './utils/time.js'

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

export default function App() {
  const { dayState }          = useDay()
  const { fitnessDispatch }   = useFitness()

  const initialScreen = (() => {
    if (!dayState.dayLockedAt) return SCREENS.IGNITION
    const lockedDate = new Date(dayState.dayLockedAt).toDateString()
    return lockedDate === new Date().toDateString() ? SCREENS.HOME : SCREENS.IGNITION
  })()

  const { screen, navigate: navigateTo, goBack } = useNavigate(initialScreen)

  const [activeWorkout, setActiveWorkout] = useState(null)

  const [showReflection, setShowReflection] = useState(() => {
    if (new URLSearchParams(window.location.search).get('eod') === '1') return true
    const h    = new Date().getHours()
    const last = localStorage.getItem('lastReflectionDate')
    return h >= 19 && last !== getTodayISO()
  })

  const [showWeeklyPlan, setShowWeeklyPlan] = useState(() => {
    if (new URLSearchParams(window.location.search).get('weekly') === '1') return true
    const now  = new Date()
    const last = localStorage.getItem('lastWeeklyPlanDate')
    return now.getDay() === 0 && now.getHours() >= 17 && !isThisWeek(last)
  })

  function navigate(target) {
    if (target === SCREENS.EOD)    { setShowReflection(true); return }
    if (target === SCREENS.WEEKLY) { setShowWeeklyPlan(true); return }
    navigateTo(target)
  }

  function handleStartWorkout(workout) {
    setActiveWorkout(workout)
  }

  function handleWorkoutComplete(log) {
    fitnessDispatch({ type: 'LOG_WORKOUT', payload: log })
    setActiveWorkout(null)
  }

  const hideNav = !shouldShowNav(screen)

  return (
    <div style={styles.root}>
      <div style={{ ...styles.screenWrap, paddingBottom: hideNav ? 0 : 'var(--nav-height)' }}>
        {screen === SCREENS.IGNITION && (
          <MorningIgnition onComplete={() => navigate(SCREENS.HOME)} />
        )}
        {screen === SCREENS.HOME && (
          <Home
            onOpenFocus={() => navigate(SCREENS.FOCUS)}
            onNavigate={navigate}
            onStartWorkout={handleStartWorkout}
          />
        )}
        {screen === SCREENS.FITNESS && (
          <Fitness onStartWorkout={handleStartWorkout} />
        )}
        {screen === SCREENS.SETTINGS && (
          <Settings onBack={goBack} />
        )}
        {screen === SCREENS.PROJECTS && (
          <Projects onBack={goBack} />
        )}
        {screen === SCREENS.FOCUS && (
          <FocusTimer onClose={goBack} />
        )}
        {screen === SCREENS.INBOX    && <Inbox />}
        {screen === SCREENS.FINANCE  && <Finance />}
      </div>

      {!hideNav && (
        <nav style={styles.nav}>
          {NAV_TABS.map(tab => {
            const active = screen === tab.screen
            return (
              <button
                key={tab.screen}
                style={styles.tab}
                onClick={() => navigate(tab.screen)}
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
      {showReflection && screen !== SCREENS.IGNITION && screen !== SCREENS.FOCUS && (
        <EodReflection
          onComplete={() => {
            localStorage.setItem('lastReflectionDate', getTodayISO())
            setShowReflection(false)
          }}
        />
      )}

      {/* Sunday Weekly Planning — shows Sunday ≥5pm if not planned this week */}
      {showWeeklyPlan && !showReflection && screen !== SCREENS.IGNITION && (
        <WeeklyPlanning
          onComplete={() => {
            localStorage.setItem('lastWeeklyPlanDate', getTodayISO())
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
    fontSize:   '18px',
    lineHeight: 1,
  },
  tabLabel: {
    fontSize:      '9px',
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
