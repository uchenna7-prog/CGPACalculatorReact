import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import SideBar from "../../components/SideBar/SideBar";
import Header from "../../components/Header/Header";
import styles from "./Home.module.css";
import { useGpa } from "../../contexts/GpaContext";

const GRADES = ["A", "B", "C", "D", "E", "F"];
const SEMESTER_NAMES = { 1: "First", 2: "Second" };

function getHonours(cgpa) {
  if (cgpa === null) return null;
  if (cgpa >= 4.5) return { label: "First Class Honours", color: "#fbbf24", emoji: "🥇" };
  if (cgpa >= 3.5) return { label: "Second Class Upper (2:1)", color: "#34d399", emoji: "🥈" };
  if (cgpa >= 2.4) return { label: "Second Class Lower (2:2)", color: "#60a5fa", emoji: "🥉" };
  if (cgpa >= 1.5) return { label: "Third Class Honours", color: "#f87171", emoji: "📋" };
  return { label: "Pass", color: "#a78bfa", emoji: "📄" };
}



// ── Draggable Floating Button ──────────────────────────────────────────────
function FloatingSummaryButton({ onClick }) {
  const btnRef = useRef(null);
  const dragging = useRef(false);
  const startPos = useRef({});
  const [dragPos, setDragPos] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const onPointerDown = (e) => {
    dragging.current = false;
    const rect = btnRef.current.getBoundingClientRect();
    startPos.current = {
      px: e.clientX,
      py: e.clientY,
      bx: rect.left,
      by: rect.top,
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    const dx = e.clientX - startPos.current.px;
    const dy = e.clientY - startPos.current.py;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragging.current = true;
    const newX = Math.max(8, Math.min(window.innerWidth - 72, startPos.current.bx + dx));
    const newY = Math.max(8, Math.min(window.innerHeight - 72, startPos.current.by + dy));
    setDragPos({ x: newX, y: newY });
  };

  const onPointerUp = () => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    if (!dragging.current) onClick();
  };

  const positionStyle = dragPos
    ? { position: "fixed", left: dragPos.x, top: dragPos.y }
    : { position: "fixed", right: 16, bottom: 30 };

  if (!mounted) return null;

  return createPortal(
    <button
      ref={btnRef}
      onPointerDown={onPointerDown}
      title="View Summary"
      style={{
        ...positionStyle,
        width: 58,
        height: 58,
        borderRadius: "12px",
        background: "linear-gradient(135deg, #4caf7d 0%, #2d7a52 100%)",
        border: "2px solid #1e2e26",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(76,175,125,0.25)",
        cursor: "grab",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        zIndex: 9999,
        userSelect: "none",
        touchAction: "none",
      }}
    >
      <span
        className="material-icons"
        style={{ fontSize: "1.5rem", color: "#fff", pointerEvents: "none" }}
      >insights</span>
      <span style={{
        fontSize: "0.5rem",
        color: "#c8f0d8",
        fontFamily: "Consolas, monospace",
        fontWeight: 700,
        letterSpacing: 0.5,
        pointerEvents: "none",
      }}>
        SUMMARY
      </span>
    </button>,
    document.body
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
function Home() {
  const navigate = useNavigate();
  const {
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
  } = useGpa();

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
                  </section>
                </div>
              ))}
            </div>
          ))}

          {/* CGPA result */}
          {cgpaError && <p className={styles.errorMsg}>{cgpaError}</p>}
          {cgpa !== null && (
            <div className={styles.cgpaResult}>
              CURRENT CGPA: {cgpa.toFixed(2)}
            </div>
          )}

          {/* CGPA buttons */}
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

          {/* Spacer so floating summary button never overlaps CGPA controls */}
          <div style={{ height: 80 }} />

        </main>
      </div>

      {/* Floating draggable summary button */}
      <FloatingSummaryButton onClick={() => navigate("/summary")} />


    </div>
  );
}

export default Home;
