import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import SideBar from "../../components/SideBar/SideBar";
import Header from "../../components/Header/Header";
import styles from "./Home.module.css";
import { useGpa } from "../../contexts/GpaContext";
import { useSettings } from "../../contexts/SettingsContext";

const SEMESTER_NAMES = { 1: "First", 2: "Second" };

// ── Draggable Floating Button ──────────────────────────────────────────────
function FloatingSummaryButton({ onClick }) {
  const btnRef   = useRef(null);
  const dragging = useRef(false);
  const startPos = useRef({});
  const [dragPos, setDragPos] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const onPointerDown = (e) => {
    dragging.current = false;
    const rect = btnRef.current.getBoundingClientRect();
    startPos.current = { px: e.clientX, py: e.clientY, bx: rect.left, by: rect.top };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup",   onPointerUp);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    const dx = e.clientX - startPos.current.px;
    const dy = e.clientY - startPos.current.py;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragging.current = true;
    const newX = Math.max(8, Math.min(window.innerWidth  - 72, startPos.current.bx + dx));
    const newY = Math.max(8, Math.min(window.innerHeight - 72, startPos.current.by + dy));
    setDragPos({ x: newX, y: newY });
  };

  const onPointerUp = () => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup",   onPointerUp);
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
        width: 58, height: 58,
        borderRadius: "12px",
        background: "linear-gradient(135deg, #4caf7d 0%, #2d7a52 100%)",
        border: "2px solid #1e2e26",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(76,175,125,0.25)",
        cursor: "grab",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 3,
        zIndex: 9999, userSelect: "none", touchAction: "none",
      }}
    >
      <span
        className="material-icons"
        style={{ fontSize: "1.5rem", color: "#fff", pointerEvents: "none" }}
      >insights</span>
      <span style={{
        fontSize: "0.5rem", color: "#c8f0d8",
        fontFamily: "Consolas, monospace", fontWeight: 700,
        letterSpacing: 0.5, pointerEvents: "none",
      }}>SUMMARY</span>
    </button>,
    document.body
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
function Home() {
  const navigate = useNavigate();
  const {
    semesters, cgpa, cgpaError,
    addSemester, removeSemester, calculateCGPA,
    updateCourse, addCourse, deleteCourse, deleteAllCourses,
    calculateSemesterGPA,
  } = useGpa();

  const {
    showGradePoints,
    showCreditSummary,
    confirmDelete,
    gradeList,
    gradePoints,
    getHonours,
    formatGpa,
  } = useSettings();

  // ── Delete helpers with optional confirm ──────────────────────────────
  const handleDeleteCourse = (semId, courseId) => {
    if (confirmDelete && !window.confirm("Delete this course?")) return;
    deleteCourse(semId, courseId);
  };

  const handleDeleteAllCourses = (semId) => {
    if (confirmDelete && !window.confirm("Delete all courses in this semester?")) return;
    deleteAllCourses(semId);
  };

  // ── Group semesters by year ────────────────────────────────────────────
  const byYear = semesters.reduce((acc, s) => {
    if (!acc[s.year]) acc[s.year] = [];
    acc[s.year].push(s);
    return acc;
  }, {});

  const honours = getHonours(cgpa);

  return (
    <div className={styles.homeContainer}>
      <SideBar />
      <div className={styles.mainWrapper}>
        <Header />
        <main className={styles.mainContent}>

          {Object.entries(byYear).map(([year, yearSemesters]) => (
            <div key={year}>
              <h2 className={styles.yearHeading}>YEAR {year}</h2>

              {yearSemesters.map((sem) => {
                // Credit unit summary values
                const totalUnits   = sem.courses.reduce((s, c) => s + (Number(c.unit) || 0), 0);
                const totalPoints  = sem.courses.reduce((s, c) => s + (Number(c.unit) || 0) * gradePoints(c.grade), 0);

                return (
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
                              {showGradePoints && <th>GRADE POINTS</th>}
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
                                    {gradeList.map((g) => (
                                      <option key={g} value={g}>{g}</option>
                                    ))}
                                  </select>
                                </td>
                                {showGradePoints && (
                                  <td className={styles.gradePointsCell}>
                                    {gradePoints(course.grade)}
                                  </td>
                                )}
                                <td>
                                  <button
                                    className={styles.deleteRowBtn}
                                    onClick={() => handleDeleteCourse(sem.id, course.id)}
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

                      {/* Credit Unit Summary */}
                      {showCreditSummary && sem.courses.length > 0 && (
                        <div className={styles.creditSummary}>
                          <span>Total Units: <strong>{totalUnits}</strong></span>
                          <span>Total Quality Points: <strong>{totalPoints}</strong></span>
                        </div>
                      )}

                      {sem.gpa === "error" && (
                        <p className={styles.errorMsg}>
                          Fill all course units with valid numbers.
                        </p>
                      )}
                      {sem.gpa !== null && sem.gpa !== "error" && (
                        <div className={styles.gpaResult}>
                          GPA: {formatGpa(sem.gpa)}
                        </div>
                      )}

                      <div className={styles.semesterControls}>
                        <button className={styles.addCourseBtn} onClick={() => addCourse(sem.id)}>
                          ADD COURSE
                        </button>
                        <button
                          className={styles.deleteAllBtn}
                          onClick={() => handleDeleteAllCourses(sem.id)}
                        >
                          DELETE ALL COURSES
                        </button>
                        <button className={styles.calcGpaBtn} onClick={() => calculateSemesterGPA(sem.id)}>
                          CALCULATE GPA
                        </button>
                      </div>
                    </section>
                  </div>
                );
              })}
            </div>
          ))}

          {/* CGPA result */}
          {cgpaError && <p className={styles.errorMsg}>{cgpaError}</p>}
          {cgpa !== null && (
            <div className={styles.cgpaResult}>
              <span>CURRENT CGPA: {formatGpa(cgpa)}</span>
              {honours && (
                <span className={styles.honoursTag} style={{ color: honours.color }}>
                  {honours.emoji} {honours.label}
                </span>
              )}
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

          <div style={{ height: 80 }} />
        </main>
      </div>

      <FloatingSummaryButton onClick={() => navigate("/summary")} />
    </div>
  );
}

export default Home;
