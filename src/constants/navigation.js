export const SCREENS = {
  HOME:          'home',
  FITNESS:       'fitness',
  FITNESS_SETUP: 'fitness-setup',
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
  { screen: SCREENS.HOME,     label: 'Home',     icon: '⌂' },
  { screen: SCREENS.FITNESS,  label: 'Fitness',  icon: '◉' },
  { screen: SCREENS.INBOX,    label: 'Inbox',    icon: '◎' },
  { screen: SCREENS.PROJECTS, label: 'Projects', icon: '▣' },
  { screen: SCREENS.FINANCE,  label: 'Finance',  icon: '◈' },
]
