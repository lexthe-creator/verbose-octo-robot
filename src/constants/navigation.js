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
  { screen: SCREENS.FITNESS,  label: 'Fitness',  icon: '◉', module: 'fitness' },
  { screen: SCREENS.INBOX,    label: 'Inbox',    icon: '◎' },
  { screen: SCREENS.PROJECTS, label: 'Projects', icon: '▣', module: 'goals' },
  { screen: SCREENS.FINANCE,  label: 'Finance',  icon: '◈', module: 'finance' },
]

export function getEnabledNavTabs(modules = {}) {
  return NAV_TABS.filter(tab => !tab.module || modules[tab.module] !== false)
}
