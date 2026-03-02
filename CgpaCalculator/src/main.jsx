import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { SideBarProvider } from './contexts/SideBarContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <SideBarProvider>
          <App />
        </SideBarProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
