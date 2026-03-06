import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home/Home'
import GPACalculator from './pages/GpaCalculator/GpaCalculator'
import CGPAPredictor from './pages/CgpaPredictor/CgpaPredictor'
import Settings from './pages/Settings/Settings'
import Summary from './pages/Summary/Summary'

const GRADE_POINTS = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };

function createCourse() {
  return { id: Date.now() + Math.random(), code: "", unit: "", grade: "A" };
}

function createSemester(semesterNum, year) {
  return {
    id: `y${year}s${semesterNum}-${Date.now()}`,
    semesterNum,
    year,
    courses: [createCourse()],
    gpa: null,
  };
}

function App() {
  const [semesters, setSemesters] = useState([createSemester(1, 1)]);
  const [cgpa, setCgpa] = useState(null);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Home
            semesters={semesters}
            setSemesters={setSemesters}
            cgpa={cgpa}
            setCgpa={setCgpa}
          />
        }
      />
      <Route path="/gpaCalculator" element={<GPACalculator />} />
      <Route path="/cgpaPredictor" element={<CGPAPredictor />} />
      <Route path="/settings" element={<Settings />} />
      <Route
        path="/summary"
        element={<Summary semesters={semesters} cgpa={cgpa} />}
      />
    </Routes>
  )
}

export default App
