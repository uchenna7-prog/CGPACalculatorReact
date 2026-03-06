import { createContext, useContext, useState } from "react";

const GRADE_POINTS = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };

function createCourse() {
  return { id: Date.now() + Math.random(), code: "", unit: "", grade: "A" };
}

const GpaCalculatorContext = createContext(null);

export function GpaCalculatorProvider({ children }) {
  const [courses, setCourses] = useState([createCourse()]);
  const [gpa, setGpa] = useState(null);
  const [error, setError] = useState("");

  const updateCourse = (id, field, value) => {
    setCourses((prev) => prev.map((c) => (c.id !== id ? c : { ...c, [field]: value })));
    setGpa(null);
    setError("");
  };

  const addCourse = () => {
    setCourses((prev) => [...prev, createCourse()]);
    setGpa(null);
  };

  const deleteCourse = (id) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setGpa(null);
  };

  const deleteAllCourses = () => {
    setCourses([]);
    setGpa(null);
    setError("");
  };

  const calculateGPA = () => {
    if (courses.length === 0) { setError("No courses added."); return; }
    const hasInvalid = courses.some((c) => c.unit === "" || isNaN(parseFloat(c.unit)));
    if (hasInvalid) {
      setError("Please fill in all course units with valid numbers.");
      setGpa(null);
      return;
    }
    const totalUnits = courses.reduce((sum, c) => sum + parseFloat(c.unit), 0);
    const totalPoints = courses.reduce(
      (sum, c) => sum + parseFloat(c.unit) * GRADE_POINTS[c.grade], 0
    );
    setError("");
    setGpa(totalUnits === 0 ? null : totalPoints / totalUnits);
  };

  return (
    <GpaCalculatorContext.Provider value={{
      courses, gpa, error,
      updateCourse, addCourse, deleteCourse, deleteAllCourses, calculateGPA,
    }}>
      {children}
    </GpaCalculatorContext.Provider>
  );
}

export function useGpaCalculator() {
  const ctx = useContext(GpaCalculatorContext);
  if (!ctx) throw new Error("useGpaCalculator must be used inside GpaCalculatorProvider");
  return ctx;
}
