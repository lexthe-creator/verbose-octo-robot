import { useState } from 'react'
import { useDay, useFitness, useSettings } from './context/index.js'
import { SCREENS, getEnabledNavTabs } from './constants/navigation.js'
import { QA_DISABLE_AUTO_PROMPTS } from './config/qa.js'
import { shouldShowNav, getRoute } from './navigation/router.js'
import { useNavigate } from './navigation/useNavigate.js'
import { getTodayISO, isThisWeek } from './utils/time.js'

import MorningIgnition from './screens/MorningIgnition.jsx'
import Home            from './screens/Home.jsx'
import Plan            from './screens/Plan.jsx'
import Calendar        from './screens/Calendar.jsx'
import Tasks           from './screens/Tasks.jsx'
import Health          from './screens/Health.jsx'
import Nutrition       from './screens/Nutrition.jsx'
import FocusTimer      from './screens/FocusTimer.jsx'
import Inbox           from './screens/Inbox.jsx'
import Finance         from './screens/Finance.jsx'
import Projects        from './screens/Projects.jsx'
import Settings        from './screens/Settings.jsx'
import Fitness         from './screens/Fitness.jsx'
import FitnessSetup    from './screens/FitnessSetup.jsx'
import WorkoutPlayer   from './components/WorkoutPlayer.jsx'
import ModuleHeaderActions from './components/ModuleHeaderActions.jsx'
import EodReflection   from './screens/EodReflection.jsx'
import WeeklyPlanning  from './screens/WeeklyPlanning.jsx'

function getInitialScreen(dayLockedAt) {
  if (!dayLockedAt) return SCREENS.HOME
  const lockedDate = new Date(dayLockedAt).toDateString()
  if (lockedDate !== new Date().toDateString()) return SCREENS.HOME
  return SCREENS.HOME
}

const MODULE_ACTION_SCREENS = new Set([
  SCREENS.HOME,
  SCREENS.PLAN,
  SCREENS.CALENDAR,
  SCREENS.TASKS,
  SCREENS.HEALTH,
  SCREENS.FITNESS,
  SCREENS.MORE,
  SCREENS.NUTRITION,
  SCREENS.PROJECTS,
  SCREENS.FINANCE,
])

export default function App() {
  const { dayState }                      = useDay()
  const { fitnessState, fitnessDispatch } = useFitness()
  const { settingsState }                 = useSettings()

  const initialScreen = getInitialScreen(dayState.dayLockedAt)

  const { screen, navigate: navigateTo, goBack } = useNavigate(initialScreen)

  const [activeWorkout, setActiveWorkout]     = useState(null)
  // true when FitnessSetup is opened from Settings (vs first-launch unconfigured flow)
  const [isEditingProgram, setIsEditingProgram] = useState(false)

  const [showReflection, setShowReflection] = useState(() => {
    if (QA_DISABLE_AUTO_PROMPTS) return false
    if (new URLSearchParams(window.location.search).get('eod') === '1') return true
    const h    = new Date().getHours()
    const last = localStorage.getItem('lastReflectionDate')
    return h >= 19 && last !== getTodayISO()
  })

  const [showWeeklyPlan, setShowWeeklyPlan] = useState(() => {
    if (QA_DISABLE_AUTO_PROMPTS) return false
    if (new URLSearchParams(window.location.search).get('weekly') === '1') return true
    const now  = new Date()
    const last = localStorage.getItem('lastWeeklyPlanDate')
    return now.getDay() === 0 && now.getHours() >= 17 && !isThisWeek(last)
  })

  function navigate(target) {
    if (target === SCREENS.EOD)    { setShowReflection(true); return }
    if (target === SCREENS.WEEKLY) { setShowWeeklyPlan(true); return }
    // Legacy direct Fitness route: keep unconfigured users in Health, not setup.
    if (target === SCREENS.FITNESS && !fitnessState.program.configured) {
      navigateTo(SCREENS.HEALTH)
      return
    }
    // Settings → "Edit training program": open wizard in editing mode
    if (target === SCREENS.FITNESS_SETUP) {
      setIsEditingProgram(true)
      navigateTo(SCREENS.FITNESS_SETUP)
      return
    }
    navigateTo(target)
  }

  function handleStartWorkout(workout) {
    setActiveWorkout({ ...workout, startedAt: Date.now() })
  }

  function handleWorkoutComplete(log) {
    fitnessDispatch({ type: 'LOG_WORKOUT', payload: log })
    setActiveWorkout(null)
  }

  const showNav = shouldShowNav(screen)
  const navTabs = getEnabledNavTabs(settingsState.modules)
  const showModuleHeaderActions = MODULE_ACTION_SCREENS.has(screen) && !activeWorkout
  const moduleHeaderActionOffset = screen === SCREENS.FINANCE ? 'belowHeader' : 'default'

  return (
    <div style={styles.root}>
      <div style={{ ...styles.screenWrap, paddingBottom: showNav ? 'var(--nav-height)' : 0 }}>
        {showModuleHeaderActions && (
          <ModuleHeaderActions onNavigate={navigate} offset={moduleHeaderActionOffset} />
        )}

        {screen === SCREENS.IGNITION && (
          <MorningIgnition onComplete={() => navigate(SCREENS.HOME)} />
        )}
        {screen === SCREENS.HOME && (
          <Home
            onNavigate={navigate}
          />
        )}
        {screen === SCREENS.HEALTH && (
          <Health
            onStartWorkout={handleStartWorkout}
          />
        )}
        {screen === SCREENS.FITNESS && (
          <Fitness onStartWorkout={handleStartWorkout} onNavigate={navigate} />
        )}
        {screen === SCREENS.FITNESS_SETUP && (
          <FitnessSetup
            onComplete={() => navigate(SCREENS.HEALTH)}
            onBack={goBack}
            isEditing={isEditingProgram}
          />
        )}
        {screen === SCREENS.SETTINGS && (
          <Settings onBack={goBack} onNavigate={navigate} />
        )}
        {screen === SCREENS.PROJECTS && (
          <Projects onBack={goBack} />
        )}
        {screen === SCREENS.FOCUS && (
          <FocusTimer onClose={goBack} />
        )}
        {screen === SCREENS.PLAN && (
          <Plan onNavigate={navigate} />
        )}
        {screen === SCREENS.CALENDAR && (
          <Calendar />
        )}
        {screen === SCREENS.TASKS && (
          <Tasks />
        )}
        {screen === SCREENS.MORE && (
          <MoreScreen onNavigate={navigate} />
        )}
        {screen === SCREENS.NUTRITION && (
          <Nutrition />
        )}
        {screen === SCREENS.INBOX    && <Inbox />}
        {screen === SCREENS.FINANCE  && <Finance />}
      </div>

      {showNav && (
        <nav style={styles.nav}>
          {navTabs.map(tab => {
            const active = screen === tab.screen ||
              (tab.screen === SCREENS.HEALTH && [SCREENS.FITNESS, SCREENS.NUTRITION].includes(screen))
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

      {[
        {
          screen:   SCREENS.EOD,
          active:   showReflection && screen !== SCREENS.IGNITION && screen !== SCREENS.FOCUS,
          onComplete() { localStorage.setItem('lastReflectionDate',  getTodayISO()); setShowReflection(false) },
        },
        {
          screen:   SCREENS.WEEKLY,
          active:   showWeeklyPlan && !showReflection && screen !== SCREENS.IGNITION,
          onComplete() { localStorage.setItem('lastWeeklyPlanDate', getTodayISO()); setShowWeeklyPlan(false) },
        },
      ]
        .filter(o => o.active)
        .sort((a, b) => (getRoute(a.screen)?.overlayPriority ?? 0) - (getRoute(b.screen)?.overlayPriority ?? 0))
        .map(o => o.screen === SCREENS.EOD
          ? <EodReflection  key={SCREENS.EOD}    onComplete={o.onComplete} />
          : <WeeklyPlanning key={SCREENS.WEEKLY} onComplete={o.onComplete} />
        )
      }

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

function MoreScreen({ onNavigate }) {
  const items = [
    { label: 'Nutrition', detail: 'Open food log', screen: SCREENS.NUTRITION },
    { label: 'Projects', detail: 'Open project planning', screen: SCREENS.PROJECTS },
    { label: 'Finance', detail: 'Open spending snapshot', screen: SCREENS.FINANCE },
    { label: 'Insights', detail: 'Coming later' },
  ]

  return (
    <main style={styles.more}>
      <p style={styles.placeholderEyebrow}>MORE</p>
      <h1 style={styles.placeholderTitle}>Life systems</h1>
      <div style={styles.moreList}>
        {items.map(item => {
          const enabled = !!item.screen
          return (
            <button
              key={item.label}
              style={{ ...styles.moreRow, opacity: enabled ? 1 : 0.54 }}
              onClick={() => enabled && onNavigate(item.screen)}
              disabled={!enabled}
            >
              <span style={styles.moreLabel}>{item.label}</span>
              <span style={styles.moreDetail}>{item.detail}</span>
            </button>
          )
        })}
      </div>
    </main>
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
  placeholder: {
    minHeight:      '100dvh',
    padding:        'max(env(safe-area-inset-top), 24px) 20px calc(var(--safe-bottom) + var(--nav-height) + 24px)',
    background:     'var(--color-bg)',
  },
  placeholderEyebrow: {
    margin:        0,
    color:         'var(--color-muted)',
    fontSize:      '10px',
    fontWeight:    700,
    letterSpacing: '0.1em',
  },
  placeholderTitle: {
    margin:      '6px 0 10px',
    fontFamily: 'var(--font-display)',
    fontSize:   '32px',
    fontWeight: 500,
    lineHeight: 1.05,
  },
  placeholderDetail: {
    margin:    0,
    color:     'var(--color-muted)',
    fontSize:  '14px',
    lineHeight: 1.45,
  },
  more: {
    minHeight:      '100dvh',
    padding:        'max(env(safe-area-inset-top), 24px) 20px calc(var(--safe-bottom) + var(--nav-height) + 24px)',
    background:     'var(--color-bg)',
  },
  moreList: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '8px',
    marginTop:     '18px',
  },
  moreRow: {
    width:          '100%',
    padding:        '14px 0',
    border:         'none',
    borderBottom:   'var(--border)',
    background:     'transparent',
    color:          'var(--color-text)',
    textAlign:      'left',
    display:        'flex',
    flexDirection:  'column',
    gap:            '4px',
  },
  moreLabel: {
    fontSize:   '15px',
    fontWeight: 600,
  },
  moreDetail: {
    color:     'var(--color-muted)',
    fontSize:  '12px',
  },
}
