import { createContext, useContext, useState, useRef } from "react";
import { useSettings } from "./SettingsContext"; // Ensure path is correct

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

const GpaContext = createContext(null);

export function GpaProvider({ children }) {
  const { gradePoints } = useSettings();

  // Keep a ref that always points to the latest gradePoints function.
  // This prevents stale-closure bugs when the grading scale changes.
  const gradePointsRef = useRef(gradePoints);
  gradePointsRef.current = gradePoints;

  const [semesters, setSemesters] = useState([createSemester(1, 1)]);
  const [cgpa, setCgpa] = useState(null);
  const [cgpaError, setCgpaError] = useState("");

  const getNext = () => {
    const last = semesters[semesters.length - 1];
    if (last.semesterNum === 1) return { semesterNum: 2, year: last.year };
    return { semesterNum: 1, year: last.year + 1 };
  };

  const addSemester = () => {
    const { semesterNum, year } = getNext();
    setSemesters((prev) => [...prev, createSemester(semesterNum, year)]);
    setCgpa(null);
    setCgpaError("");
  };

  const removeSemester = () => {
    if (semesters.length === 1) return;
    setSemesters((prev) => prev.slice(0, -1));
    setCgpa(null);
    setCgpaError("");
  };

  const calculateCGPA = () => {
    const gp = gradePointsRef.current;
    const allCourses = semesters.flatMap((s) => s.courses);
    const hasInvalid = allCourses.some(
      (c) => c.unit === "" || isNaN(parseFloat(c.unit))
    );
    if (hasInvalid) {
      setCgpaError("Please fill in all course units with valid numbers.");
      setCgpa(null);
      return;
    }
    const totalUnits = allCourses.reduce((sum, c) => sum + parseFloat(c.unit), 0);
    const totalPoints = allCourses.reduce(
      (sum, c) => sum + parseFloat(c.unit) * gp(c.grade),
      0
    );
    setCgpaError("");
    setCgpa(totalUnits === 0 ? null : totalPoints / totalUnits);
  };

  const updateCourse = (semId, courseId, field, value) => {
    setSemesters((prev) =>
      prev.map((s) =>
        s.id !== semId
          ? s
          : {
              ...s,
              gpa: null,
              courses: s.courses.map((c) =>
                c.id !== courseId ? c : { ...c, [field]: value }
              ),
            }
      )
    );
    setCgpa(null);
    setCgpaError("");
  };

  const addCourse = (semId) => {
    setSemesters((prev) =>
      prev.map((s) =>
        s.id !== semId ? s : { ...s, courses: [...s.courses, createCourse()] }
      )
    );
  };

  const deleteCourse = (semId, courseId) => {
    setSemesters((prev) =>
      prev.map((s) => {
        if (s.id !== semId) return s;
        return {
          ...s,
          courses: s.courses.filter((c) => c.id !== courseId),
          gpa: null,
        };
      })
    );
    setCgpa(null);
  };

  const deleteAllCourses = (semId) => {
    setSemesters((prev) =>
      prev.map((s) =>
        s.id !== semId ? s : { ...s, courses: [], gpa: null }
      )
    );
    setCgpa(null);
  };

  const calculateSemesterGPA = (semId) => {
    const gp = gradePointsRef.current;
    setSemesters((prev) =>
      prev.map((s) => {
        if (s.id !== semId) return s;
        const hasInvalid = s.courses.some(
          (c) => c.unit === "" || isNaN(parseFloat(c.unit))
        );
        if (hasInvalid) return { ...s, gpa: "error" };
        const totalUnits = s.courses.reduce(
          (sum, c) => sum + parseFloat(c.unit),
          0
        );
        const totalPoints = s.courses.reduce(
          (sum, c) => sum + parseFloat(c.unit) * gp(c.grade),
          0
        );
        return {
          ...s,
          gpa: totalUnits === 0 ? null : totalPoints / totalUnits,
        };
      })
    );
  };

  return (
    <GpaContext.Provider
      value={{
        semesters,
        cgpa,
        cgpaError,
        addSemester,
        removeSemester,
        calculateCGPA,
        updateCourse,
        addCourse,
        deleteCourse,
        deleteAllCourses,
        calculateSemesterGPA,
      }}
    >
      {children}
    </GpaContext.Provider>
  );
}

export function useGpa() {
  const context = useContext(GpaContext);
  if (!context) throw new Error("useGpa must be used inside GpaProvider");
  return context;
}
