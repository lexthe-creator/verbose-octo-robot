export const SCREENS = {
  HOME:          'home',
  PLAN:          'plan',
  CALENDAR:      'calendar',
  TASKS:         'tasks',
  FITNESS:       'fitness',
  FITNESS_SETUP: 'fitness-setup',
  MORE:          'more',
  NUTRITION:     'nutrition',
  INBOX:         'inbox',
  PROJECTS:      'projects',
  FINANCE:       'finance',
  SETTINGS:      'settings',
  IGNITION:      'ignition',
  FOCUS:         'focus',
  EOD:           'eod',
  WEEKLY:        'weekly',
}

export const NAV_TABS = [
  { screen: SCREENS.CALENDAR, label: 'Calendar', icon: '□' },
  { screen: SCREENS.TASKS,    label: 'Tasks',    icon: '☑' },
  { screen: SCREENS.HOME,     label: 'Home',     icon: '⌂' },
  { screen: SCREENS.FITNESS,  label: 'Fitness',  icon: '◉' },
  { screen: SCREENS.MORE,     label: 'More',     icon: '⋯' },
]

export function getEnabledNavTabs(modules = {}) {
  return NAV_TABS.filter(tab => !tab.module || modules[tab.module] !== false)
}
