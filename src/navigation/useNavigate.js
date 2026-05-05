import { useState, useCallback } from 'react'
import { SCREENS } from '../constants/navigation'
import { getRoute } from './router'

export function useNavigate(initialScreen = SCREENS.HOME) {
  const [screen,  setScreen]  = useState(initialScreen)
  const [history, setHistory] = useState([initialScreen])

  const navigate = useCallback((target) => {
    if (!getRoute(target)) {
      console.warn(`[Router] Unknown screen: ${target}`)
      return
    }
    setScreen(target)
    setHistory(prev => [...prev, target])
  }, [])

  const goBack = useCallback(() => {
    setHistory(prev => {
      if (prev.length <= 1) return prev
      const next = prev.slice(0, -1)
      setScreen(next[next.length - 1])
      return next
    })
  }, [])

  return { screen, navigate, goBack, history }
}
