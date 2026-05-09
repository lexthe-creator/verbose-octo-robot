import { SCREENS } from '../constants/navigation'

const ROUTES = new Map([
  [SCREENS.HOME,          { showNav: true,  isOverlay: false }],
  [SCREENS.FITNESS,       { showNav: true,  isOverlay: false }],
  [SCREENS.INBOX,         { showNav: true,  isOverlay: false }],
  [SCREENS.PROJECTS,      { showNav: true,  isOverlay: false }],
  [SCREENS.FINANCE,       { showNav: true,  isOverlay: false }],
  [SCREENS.FITNESS_SETUP, { showNav: false, isOverlay: false }],
  [SCREENS.SETTINGS,      { showNav: false, isOverlay: false }],
  [SCREENS.IGNITION,      { showNav: false, isOverlay: false }],
  [SCREENS.FOCUS,         { showNav: false, isOverlay: false }],
  [SCREENS.EOD,           { showNav: false, isOverlay: true, overlayPriority: 1 }],
  [SCREENS.WEEKLY,        { showNav: false, isOverlay: true, overlayPriority: 2 }],
])

export function getRoute(screen)      { return ROUTES.get(screen) }
export function shouldShowNav(screen) { return ROUTES.get(screen)?.showNav    ?? false }
export function isOverlay(screen)     { return ROUTES.get(screen)?.isOverlay  ?? false }
