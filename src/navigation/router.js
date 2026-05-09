import { SCREENS } from '../constants/navigation'

export const ROUTES = [
  { screen: SCREENS.HOME,     showNav: true,  overlay: false },
  { screen: SCREENS.FITNESS,  showNav: true,  overlay: false },
  { screen: SCREENS.INBOX,    showNav: true,  overlay: false },
  { screen: SCREENS.PROJECTS, showNav: true,  overlay: false },
  { screen: SCREENS.FINANCE,  showNav: true,  overlay: false },
  { screen: SCREENS.FITNESS_SETUP, showNav: false, overlay: false },
  { screen: SCREENS.SETTINGS,      showNav: false, overlay: false },
  { screen: SCREENS.IGNITION, showNav: false, overlay: false },
  { screen: SCREENS.FOCUS,    showNav: false, overlay: false },
  { screen: SCREENS.EOD,      showNav: false, overlay: true,  overlayPriority: 200 },
  { screen: SCREENS.WEEKLY,   showNav: false, overlay: true,  overlayPriority: 190 },
]

export const getRoute      = (screen) => ROUTES.find(r => r.screen === screen)
export const shouldShowNav = (screen) => getRoute(screen)?.showNav ?? false
export const isOverlay     = (screen) => getRoute(screen)?.overlay ?? false
