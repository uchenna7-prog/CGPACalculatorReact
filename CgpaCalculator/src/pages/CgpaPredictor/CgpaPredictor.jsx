import { useState } from "react";
import SideBar from "../../components/SideBar/SideBar";
import Header from "../../components/Header/Header";
import styles from "./CGPAPredictor.module.css";

const GRADES = ["A", "B", "C", "D", "E", "F"];
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

function CGPAPredictor() {
  const [currentCgpa, setCurrentCgpa] = useState("");
  const [totalUnits, setTotalUnits] = useState("");
  const [semesterCount, setSemesterCount] = useState("select");
  const [semesters, setSemesters] = useState([]);
  const [predictedCgpa, setPredictedCgpa] = useState(null);
  const [error, setError] = useState("");

  const handleSemesterCountChange = (e) => {
    const val = e.target.value;
    setSemesterCount(val);
    setPredictedCgpa(null);
    setError("");
    if (val === "select") {
      setSemesters([]);
      return;
    }
    const count = parseInt(val);
    const newSemesters = Array.from({ length: count }, (_, i) => createSemester(i + 1));
    setSemesters(newSemesters);
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
    setPredictedCgpa(null);
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
        return { ...s, courses: s.courses.filter((c) => c.id !== courseId), gpa: null };
      })
    );
  };

  const deleteAllCourses = (semId) => {
    setSemesters((prev) =>
      prev.map((s) =>
        s.id !== semId ? s : { ...s, courses: [], gpa: null }
      )
    );
  };

  const predictSemesterGPA = (semId) => {
    setSemesters((prev) =>
      prev.map((s) => {
        if (s.id !== semId) return s;
        const hasInvalid = s.courses.some(
          (c) => c.unit === "" || isNaN(parseFloat(c.unit))
        );
        if (hasInvalid) return { ...s, gpa: "error" };
        const totalU = s.courses.reduce((sum, c) => sum + parseFloat(c.unit), 0);
        const totalP = s.courses.reduce(
          (sum, c) => sum + parseFloat(c.unit) * GRADE_POINTS[c.grade],
          0
        );
        return { ...s, gpa: totalU === 0 ? null : totalP / totalU };
      })
    );
  };

  const predictCGPA = () => {
    if (!currentCgpa || isNaN(parseFloat(currentCgpa))) {
      setError("Please enter your current CGPA.");
      return;
    }
    if (!totalUnits || isNaN(parseFloat(totalUnits))) {
      setError("Please enter your total course units taken so far.");
      return;
    }
    if (semesters.length === 0) {
      setError("Please select how many semesters ahead to predict.");
      return;
    }
    const allCourses = semesters.flatMap((s) => s.courses);
    const hasInvalid = allCourses.some(
      (c) => c.unit === "" || isNaN(parseFloat(c.unit))
    );
    if (hasInvalid) {
      setError("Please fill all course units with valid numbers.");
      return;
    }

    const futureTotalUnits = allCourses.reduce((sum, c) => sum + parseFloat(c.unit), 0);
    const futureTotalPoints = allCourses.reduce(
      (sum, c) => sum + parseFloat(c.unit) * GRADE_POINTS[c.grade],
      0
    );

    const previousPoints = parseFloat(currentCgpa) * parseFloat(totalUnits);
    const cumulativePoints = previousPoints + futureTotalPoints;
    const cumulativeUnits = parseFloat(totalUnits) + futureTotalUnits;

    setError("");
    setPredictedCgpa(cumulativePoints / cumulativeUnits);
  };

  return (
    <div className={styles.pageContainer}>
      <SideBar />
      <div className={styles.mainWrapper}>
        <Header />
        <main className={styles.mainContent}>

          {/* Initial inputs */}
          <div className={styles.initialInputs}>
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="current-cgpa">
                Enter your current CGPA:
              </label>
              <input
                id="current-cgpa"
                className={styles.textInput}
                type="number"
                step="0.01"
                min="0"
                max="5"
                value={currentCgpa}
                onChange={(e) => { setCurrentCgpa(e.target.value); setPredictedCgpa(null); setError(""); }}
                placeholder="e.g. 3.50"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="total-units">
                Total course units taken so far:
              </label>
              <input
                id="total-units"
                className={styles.textInput}
                type="number"
                min="0"
                value={totalUnits}
                onChange={(e) => { setTotalUnits(e.target.value); setPredictedCgpa(null); setError(""); }}
                placeholder="e.g. 90"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="semester-count">
                How many semesters ahead would you like to predict:
              </label>
              <select
                id="semester-count"
                className={styles.selectInput}
                value={semesterCount}
                onChange={handleSemesterCountChange}
              >
                <option value="select">Select</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Semester sections */}
          {semesters.map((sem) => (
            <div key={sem.id}>
              <h2 className={styles.semesterHeading}>Semester {sem.num}</h2>

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
                              placeholder="e.g. MTH101"
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
                              placeholder="e.g. 3"
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

                {/* Per-semester GPA result above buttons */}
                {sem.gpa === "error" && (
                  <p className={styles.errorMsg}>Fill all course units with valid numbers.</p>
                )}
                {sem.gpa !== null && sem.gpa !== "error" && (
                  <div className={styles.gpaResult}>
                    PREDICTED SEMESTER GPA: {sem.gpa.toFixed(2)}
                  </div>
                )}

                <div className={styles.semesterControls}>
                  <button className={styles.addCourseBtn} onClick={() => addCourse(sem.id)}>
                    ADD COURSE
                  </button>
                  <button className={styles.deleteAllBtn} onClick={() => deleteAllCourses(sem.id)}>
                    DELETE ALL COURSES
                  </button>
                  <button className={styles.predictGpaBtn} onClick={() => predictSemesterGPA(sem.id)}>
                    PREDICT SEMESTER GPA
                  </button>
                </div>
              </section>
            </div>
          ))}

          {/* Predict CGPA button + result */}
          {semesters.length > 0 && (
            <>
              {error && <p className={styles.errorMsg}>{error}</p>}
              {predictedCgpa !== null && (
                <div className={styles.cgpaResult}>
                  PREDICTED CGPA: {predictedCgpa.toFixed(2)}
                </div>
              )}
              <button className={styles.predictCgpaBtn} onClick={predictCGPA}>
                PREDICT CGPA
              </button>
            </>
          )}

        </main>
      </div>
    </div>
  );
}

export default CGPAPredictor;