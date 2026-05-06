import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { SettingsProvider, UserProvider, DayProvider } from './context/index.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SettingsProvider>
      <UserProvider>
        <DayProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </DayProvider>
      </UserProvider>
    </SettingsProvider>
  </StrictMode>,
)
