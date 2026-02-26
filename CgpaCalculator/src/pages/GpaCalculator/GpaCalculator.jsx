import { useState } from "react";
import SideBar from "../../components/SideBar/SideBar";
import Header from "../../components/Header/Header";
import styles from "./GpaCalculator.module.css";

const GRADES = ["A", "B", "C", "D", "E", "F"];
const GRADE_POINTS = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };

function createCourse() {
  return { id: Date.now() + Math.random(), code: "", unit: "", grade: "A" };
}

function GPACalculator() {
  const [courses, setCourses] = useState([createCourse()]);
  const [gpa, setGpa] = useState(null);
  const [error, setError] = useState("");

  const updateCourse = (id, field, value) => {
    setCourses((prev) =>
      prev.map((c) => (c.id !== id ? c : { ...c, [field]: value }))
    );
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
    if (courses.length === 0) {
      setError("No courses added.");
      return;
    }
    const hasInvalid = courses.some(
      (c) => c.unit === "" || isNaN(parseFloat(c.unit))
    );
    if (hasInvalid) {
      setError("Please fill in all course units with valid numbers.");
      setGpa(null);
      return;
    }
    const totalUnits = courses.reduce((sum, c) => sum + parseFloat(c.unit), 0);
    const totalPoints = courses.reduce(
      (sum, c) => sum + parseFloat(c.unit) * GRADE_POINTS[c.grade],
      0
    );
    setError("");
    setGpa(totalUnits === 0 ? null : totalPoints / totalUnits);
  };

  return (
    <div className={styles.pageContainer}>
      <SideBar />
      <div className={styles.mainWrapper}>
        <Header />
        <main className={styles.mainContent}>

          <section className={styles.detailsContainer}>
            {courses.length > 0 ? (
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
                  {courses.map((course, idx) => (
                    <tr key={course.id}>
                      <td>{idx + 1}</td>
                      <td>
                        <input
                          className={styles.inputField}
                          type="text"
                          value={course.code}
                          onChange={(e) =>
                            updateCourse(course.id, "code", e.target.value.toUpperCase())
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
                            updateCourse(course.id, "unit", e.target.value)
                          }
                          placeholder="e.g. 3"
                        />
                      </td>
                      <td>
                        <select
                          className={styles.selectField}
                          value={course.grade}
                          onChange={(e) =>
                            updateCourse(course.id, "grade", e.target.value)
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
                          onClick={() => deleteCourse(course.id)}
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

            {/* Result above buttons */}
            {error && <p className={styles.errorMsg}>{error}</p>}
            {gpa !== null && (
              <div className={styles.gpaResult}>GPA: {gpa.toFixed(2)}</div>
            )}

            {/* Buttons */}
            <div className={styles.buttonContainer}>
              <button className={styles.addCourseBtn} onClick={addCourse}>
                ADD COURSE
              </button>
              <button className={styles.deleteAllBtn} onClick={deleteAllCourses}>
                DELETE ALL COURSES
              </button>
              <button className={styles.calcGpaBtn} onClick={calculateGPA}>
                CALCULATE GPA
              </button>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}

export default GPACalculator;