import { useState } from "react";
import SideBar from "../../components/SideBar/SideBar";
import Header from "../../components/Header/Header";
import styles from "./Home.module.css";

const GRADES = ["A", "B", "C", "D", "E", "F"];
const GRADE_POINTS = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };
const SEMESTER_NAMES = { 1: "First", 2: "Second" };

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

function Home() {
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
      (sum, c) => sum + parseFloat(c.unit) * GRADE_POINTS[c.grade],
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
        const updated = s.courses.filter((c) => c.id !== courseId);
        return { ...s, courses: updated, gpa: null };
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
    setSemesters((prev) =>
      prev.map((s) => {
        if (s.id !== semId) return s;
        const hasInvalid = s.courses.some(
          (c) => c.unit === "" || isNaN(parseFloat(c.unit))
        );
        if (hasInvalid) return { ...s, gpa: "error" };
        const totalUnits = s.courses.reduce((sum, c) => sum + parseFloat(c.unit), 0);
        const totalPoints = s.courses.reduce(
          (sum, c) => sum + parseFloat(c.unit) * GRADE_POINTS[c.grade],
          0
        );
        return { ...s, gpa: totalUnits === 0 ? null : totalPoints / totalUnits };
      })
    );
  };

  const byYear = semesters.reduce((acc, s) => {
    if (!acc[s.year]) acc[s.year] = [];
    acc[s.year].push(s);
    return acc;
  }, {});

  return (
    <div className={styles.homeContainer}>
      <SideBar />
      <div className={styles.mainWrapper}>
        <Header />
        <main className={styles.mainContent}>

          {/* Semesters grouped by year */}
          {Object.entries(byYear).map(([year, yearSemesters]) => (
            <div key={year}>
              <h2 className={styles.yearHeading}>YEAR {year}</h2>

              {yearSemesters.map((sem) => (
                <div key={sem.id}>
                  <h3 className={styles.semesterHeading}>
                    {SEMESTER_NAMES[sem.semesterNum]} Semester
                  </h3>

                  <section className={styles.semesterCard}>
                    {sem.courses.length > 0 ? (
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>S/N</th>
                            <th>COURSE CODE</th>
                            <th>COURSE UNITS</th>
                            <th>GRADE</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {sem.courses.map((course, idx) => (
                            <tr key={course.id}>
                              <td>{idx + 1}</td>
                              <td>
                                <input
                                  className={styles.inputField}
                                  type="text"
                                  value={course.code}
                                  onChange={(e) =>
                                    updateCourse(sem.id, course.id, "code", e.target.value.toUpperCase())
                                  }
                                  
                                />
                              </td>
                              <td>
                                <input
                                  className={styles.inputField}
                                  type="number"
                                  min="1"
                                  max="6"
                                  value={course.unit}
                                  onChange={(e) =>
                                    updateCourse(sem.id, course.id, "unit", e.target.value)
                                  }
                                  
                                />
                              </td>
                              <td>
                                <select
                                  className={styles.selectField}
                                  value={course.grade}
                                  onChange={(e) =>
                                    updateCourse(sem.id, course.id, "grade", e.target.value)
                                  }
                                >
                                  {GRADES.map((g) => (
                                    <option key={g} value={g}>{g}</option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <button
                                  className={styles.deleteRowBtn}
                                  onClick={() => deleteCourse(sem.id, course.id)}
                                  title="Delete course"
                                >
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className={styles.noCoursesMsg}>No courses added.</p>
                    )}

                    <div className={styles.semesterControls}>
                      <button className={styles.addCourseBtn} onClick={() => addCourse(sem.id)}>
                        ADD COURSE
                      </button>
                      <button className={styles.deleteAllBtn} onClick={() => deleteAllCourses(sem.id)}>
                        DELETE ALL COURSES
                      </button>
                      <button className={styles.calcGpaBtn} onClick={() => calculateSemesterGPA(sem.id)}>
                        CALCULATE GPA
                      </button>
                    </div>

                    {sem.gpa === "error" && (
                      <p className={styles.errorMsg}>
                        Fill all course units with valid numbers.
                      </p>
                    )}
                    {sem.gpa !== null && sem.gpa !== "error" && (
                      <div className={styles.gpaResult}>
                        GPA: {sem.gpa.toFixed(2)}
                      </div>
                    )}
                  </section>
                </div>
              ))}
            </div>
          ))}

          {/* CGPA control buttons — at the bottom */}
          <div className={styles.cgpaControls}>
            <button className={styles.addSemBtn} onClick={addSemester}>
              ADD SEMESTER
            </button>
            <button
              className={styles.removeSemBtn}
              onClick={removeSemester}
              disabled={semesters.length === 1}
            >
              REMOVE SEMESTER
            </button>
            <button className={styles.calcCgpaBtn} onClick={calculateCGPA}>
              CALCULATE CGPA
            </button>
          </div>

          {/* CGPA result */}
          {cgpaError && <p className={styles.errorMsg}>{cgpaError}</p>}
          {cgpa !== null && (
            <div className={styles.cgpaResult}>
              CURRENT CGPA: {cgpa.toFixed(2)}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default Home;