import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {
  SettingsProvider, UserProvider, FitnessProvider,
  DayProvider, InboxProvider,
  ProjectsProvider, FinanceProvider, PlanningProvider,
} from './context/index.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SettingsProvider>
      <UserProvider>
        <FitnessProvider>
          <DayProvider>
            <InboxProvider>
              <ProjectsProvider>
                <FinanceProvider>
                  <PlanningProvider>
                    <App />
                  </PlanningProvider>
                </FinanceProvider>
              </ProjectsProvider>
            </InboxProvider>
          </DayProvider>
        </FitnessProvider>
      </UserProvider>
    </SettingsProvider>
  </StrictMode>,
)
