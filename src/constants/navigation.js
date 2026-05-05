export const SCREENS = {
  HOME:     'home',
  FITNESS:  'fitness',
  INBOX:    'inbox',
  PROJECTS: 'projects',
  FINANCE:  'finance',
  SETTINGS: 'settings',
  IGNITION: 'ignition',
  FOCUS:    'focus',
  EOD:      'eod',
  WEEKLY:   'weekly',
}

// Screens where the bottom nav is hidden.
// NOTE: SPEC.md lists 'projects' as nav-hidden, but current code does not hide it.
// This constant matches current behavior. Reconcile with SPEC in a future step.
export const HIDE_NAV = [
  SCREENS.IGNITION,
  SCREENS.FOCUS,
  SCREENS.SETTINGS,
]

export const NAV_TABS = [
  { screen: SCREENS.HOME,     label: 'Home',     icon: '⌂' },
  { screen: SCREENS.FITNESS,  label: 'Fitness',  icon: '◉' },
  { screen: SCREENS.INBOX,    label: 'Inbox',    icon: '◎' },
  { screen: SCREENS.PROJECTS, label: 'Projects', icon: '▣' },
  { screen: SCREENS.FINANCE,  label: 'Finance',  icon: '◈' },
]
