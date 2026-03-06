import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home/Home'
import GPACalculator from './pages/GpaCalculator/GpaCalculator'
import CGPAPredictor from './pages/CgpaPredictor/CgpaPredictor'
import Settings from './pages/Settings/Settings'
import Summary from './pages/Summary/Summary'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/gpaCalculator" element={<GPACalculator />} />
      <Route path="/cgpaPredictor" element={<CGPAPredictor />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/summary" element={<Summary />} />
    </Routes>
  )
}

export default App
