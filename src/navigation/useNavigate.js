import { useState, useRef, useCallback } from 'react'
import { getRoute, isOverlay } from './router'

export function useNavigate(initialScreen) {
  const [screen, setScreen] = useState(initialScreen)
  const historyRef = useRef([])

  const navigate = useCallback((target) => {
    if (!getRoute(target)) {
      console.warn(`[Router] Unknown screen: ${target}`)
      return
    }
    if (isOverlay(target)) return
    historyRef.current.push(screen)
    setScreen(target)
  }, [screen])

  const goBack = useCallback(() => {
    if (historyRef.current.length === 0) return
    setScreen(historyRef.current.pop())
  }, [])

  return { screen, navigate, goBack }
}
