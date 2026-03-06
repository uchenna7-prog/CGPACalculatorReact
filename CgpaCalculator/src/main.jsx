import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { SideBarProvider } from './contexts/SideBarContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { GpaProvider } from './contexts/GpaContext.jsx'
import { PredictionProvider } from './contexts/PredictionContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <SideBarProvider>
          <GpaProvider>
            <PredictionProvider>
              <App />
            </PredictionProvider>
          </GpaProvider>
        </SideBarProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
