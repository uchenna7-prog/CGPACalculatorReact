import { createContext, useContext, useState } from "react";

const GRADE_POINTS = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };

function createCourse() {
  return { id: Date.now() + Math.random(), code: "", unit: "", grade: "A" };
}

function createSemester(num) {
  return {
    id: `sem-${num}-${Date.now()}`,
    num,
    courses: [createCourse()],
    gpa: null,
  };
}

const PredictionContext = createContext(null);

export function PredictionProvider({ children }) {
  const [currentCgpa, setCurrentCgpa] = useState("");
  const [totalUnits, setTotalUnits] = useState("");
  const [semesterCount, setSemesterCount] = useState("select");
  const [semesters, setSemesters] = useState([]);
  const [predictedCgpa, setPredictedCgpa] = useState(null);
  const [error, setError] = useState("");

  const handleSemesterCountChange = (val) => {
    setSemesterCount(val);
    setPredictedCgpa(null);
    setError("");
    if (val === "select") { setSemesters([]); return; }
    const count = parseInt(val);
    setSemesters(Array.from({ length: count }, (_, i) => createSemester(i + 1)));
  };

  const updateCourse = (semId, courseId, field, value) => {
    setSemesters((prev) =>
      prev.map((s) =>
        s.id !== semId ? s : {
          ...s, gpa: null,
          courses: s.courses.map((c) => c.id !== courseId ? c : { ...c, [field]: value }),
        }
      )
    );
    setPredictedCgpa(null);
  };

  const addCourse = (semId) => {
    setSemesters((prev) =>
      prev.map((s) => s.id !== semId ? s : { ...s, courses: [...s.courses, createCourse()] })
    );
  };

  const deleteCourse = (semId, courseId) => {
    setSemesters((prev) =>
      prev.map((s) => {
        if (s.id !== semId) return s;
        return { ...s, courses: s.courses.filter((c) => c.id !== courseId), gpa: null };
      })
    );
  };

  const deleteAllCourses = (semId) => {
    setSemesters((prev) =>
      prev.map((s) => s.id !== semId ? s : { ...s, courses: [], gpa: null })
    );
  };

  const predictSemesterGPA = (semId) => {
    setSemesters((prev) =>
      prev.map((s) => {
        if (s.id !== semId) return s;
        const hasInvalid = s.courses.some((c) => c.unit === "" || isNaN(parseFloat(c.unit)));
        if (hasInvalid) return { ...s, gpa: "error" };
        const tu = s.courses.reduce((sum, c) => sum + parseFloat(c.unit), 0);
        const tp = s.courses.reduce((sum, c) => sum + parseFloat(c.unit) * GRADE_POINTS[c.grade], 0);
        return { ...s, gpa: tu === 0 ? null : tp / tu };
      })
    );
  };

  const predictCGPA = () => {
    if (!currentCgpa || isNaN(parseFloat(currentCgpa))) {
      setError("Please enter your current CGPA."); return;
    }
    if (!totalUnits || isNaN(parseFloat(totalUnits))) {
      setError("Please enter your total course units taken so far."); return;
    }
    if (semesters.length === 0) {
      setError("Please select how many semesters ahead to predict."); return;
    }
    const allCourses = semesters.flatMap((s) => s.courses);
    const hasInvalid = allCourses.some((c) => c.unit === "" || isNaN(parseFloat(c.unit)));
    if (hasInvalid) { setError("Please fill all course units with valid numbers."); return; }

    const futureTotalUnits = allCourses.reduce((sum, c) => sum + parseFloat(c.unit), 0);
    const futureTotalPoints = allCourses.reduce(
      (sum, c) => sum + parseFloat(c.unit) * GRADE_POINTS[c.grade], 0
    );
    const prevPoints = parseFloat(currentCgpa) * parseFloat(totalUnits);
    const cumPoints = prevPoints + futureTotalPoints;
    const cumUnits = parseFloat(totalUnits) + futureTotalUnits;
    setError("");
    setPredictedCgpa(cumPoints / cumUnits);
  };

  return (
    <PredictionContext.Provider value={{
      currentCgpa, setCurrentCgpa,
      totalUnits, setTotalUnits,
      semesterCount, handleSemesterCountChange,
      semesters,
      predictedCgpa,
      error, setError,
      updateCourse, addCourse, deleteCourse,
      deleteAllCourses, predictSemesterGPA, predictCGPA,
    }}>
      {children}
    </PredictionContext.Provider>
  );
}

export function usePrediction() {
  const ctx = useContext(PredictionContext);
  if (!ctx) throw new Error("usePrediction must be used inside PredictionProvider");
  return ctx;
}
