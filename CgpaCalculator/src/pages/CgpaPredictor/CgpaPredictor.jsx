import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import SideBar from "../../components/SideBar/SideBar";
import Header from "../../components/Header/Header";
import styles from "./CgpaPredictor.module.css";
import { usePrediction } from "../../contexts/PredictionContext";
import { useSettings } from "../../contexts/SettingsContext";

// ── Draggable Floating Button ──────────────────────────────────────────────
function FloatingButton({ onClick, icon, label, gradient }) {
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
      title={label}
      style={{
        ...positionStyle,
        width: 58, height: 58,
        borderRadius: "12px",
        background: gradient,
        border: "2px solid #1e2e26",
        boxShadow: "0 4px 20px rgba(0,0,0,0.45)",
        cursor: "grab",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 3, zIndex: 9999,
        userSelect: "none", touchAction: "none",
      }}
    >
      <span className="material-icons" style={{ fontSize: "1.5rem", color: "#fff", pointerEvents: "none" }}>
        {icon}
      </span>
      <span style={{
        fontSize: "0.48rem", color: "#fff",
        fontFamily: "Consolas, monospace", fontWeight: 700,
        letterSpacing: 0.5, pointerEvents: "none", opacity: 0.85,
      }}>
        {label}
      </span>
    </button>,
    document.body
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
function CGPAPredictor() {
  const navigate = useNavigate();
  const {
    currentCgpa, setCurrentCgpa,
    totalUnits,   setTotalUnits,
    semesterCount, handleSemesterCountChange,
    semesters,
    predictedCgpa,
    error, setError,
    updateCourse, addCourse, deleteCourse,
    deleteAllCourses, predictSemesterGPA, predictCGPA,
  } = usePrediction();

  const {
    decimalPlaces,
    showGradePoints,
    showCreditSummary,
    confirmDelete,
    gradePoints,
    availableGrades,
  } = useSettings();

  const dp = Number(decimalPlaces);

  // ── Delete helpers that respect confirmDelete ──────────────────────────
  const handleDeleteCourse = (semId, courseId) => {
    if (confirmDelete && !window.confirm("Delete this course?")) return;
    deleteCourse(semId, courseId);
  };

  const handleDeleteAll = (semId) => {
    if (confirmDelete && !window.confirm("Delete all courses in this semester?")) return;
    deleteAllCourses(semId);
  };

  // ── Per-semester credit summary ────────────────────────────────────────
  const getSummary = (courses) => ({
    semTotalUnits:    courses.reduce((s, c) => s + (Number(c.unit) || 0), 0),
    semWeightedPoints: courses.reduce((s, c) => s + (Number(c.unit) || 0) * gradePoints(c.grade), 0),
  });

  return (
    <div className={styles.pageContainer}>
      <SideBar />
      <div className={styles.mainWrapper}>
        <Header />
        <main className={styles.mainContent}>

          {/* ── Initial inputs ── */}
          <div className={styles.initialInputs}>
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="current-cgpa">
                Enter your current CGPA:
              </label>
              <input
                id="current-cgpa"
                className={styles.textInput}
                type="number"
                step="0.01" min="0" max="5"
                value={currentCgpa}
                onChange={(e) => { setCurrentCgpa(e.target.value); setError(""); }}
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
                onChange={(e) => { setTotalUnits(e.target.value); setError(""); }}
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
                onChange={(e) => handleSemesterCountChange(e.target.value)}
              >
                <option value="select">Select</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Semester tables ── */}
          {semesters.map((sem) => {
            const { semTotalUnits, semWeightedPoints } = getSummary(sem.courses);

            return (
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
                          {showGradePoints && <th>TCU</th>}
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
                                min="1" max="6"
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
                                {availableGrades.map((g) => (
                                  <option key={g} value={g}>{g}</option>
                                ))}
                              </select>
                            </td>
                            {/* TCU = unit × gradePoints */}
                            {showGradePoints && (
                              <td style={{ textAlign: "center", fontWeight: 600 }}>
                                {(Number(course.unit) || 0) * gradePoints(course.grade)}
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

                      {/* Summary tfoot row */}
                      {showCreditSummary && (
                        <tfoot>
                          <tr className={styles.summaryRow}>
                            <td colSpan={2}><strong>TOTAL</strong></td>
                            <td><strong>{semTotalUnits}</strong></td>
                            {showGradePoints ? (
                              <>
                                <td></td>
                                <td style={{ textAlign: "center" }}>
                                  <strong>{semWeightedPoints}</strong>
                                </td>
                                <td></td>
                              </>
                            ) : (
                              <td colSpan={2}></td>
                            )}
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  ) : (
                    <p className={styles.noCoursesMsg}>No courses added.</p>
                  )}

                  {sem.gpa === "error" && (
                    <p className={styles.errorMsg}>Fill all course units with valid numbers.</p>
                  )}
                  {sem.gpa !== null && sem.gpa !== "error" && (
                    <div className={styles.gpaResult}>
                      PREDICTED SEMESTER GPA: {sem.gpa.toFixed(dp)}
                    </div>
                  )}

                  <div className={styles.semesterControls}>
                    <button className={styles.addCourseBtn} onClick={() => addCourse(sem.id)}>
                      ADD COURSE
                    </button>
                    <button className={styles.deleteAllBtn} onClick={() => handleDeleteAll(sem.id)}>
                      DELETE ALL COURSES
                    </button>
                    <button className={styles.predictGpaBtn} onClick={() => predictSemesterGPA(sem.id)}>
                      PREDICT GPA
                    </button>
                  </div>
                </section>
              </div>
            );
          })}

          {/* ── Predict CGPA ── */}
          {semesters.length > 0 && (
            <>
              {error && <p className={styles.errorMsg}>{error}</p>}
              {predictedCgpa !== null && (
                <div className={styles.cgpaResult}>
                  PREDICTED CGPA: {predictedCgpa.toFixed(dp)}
                </div>
              )}
              <button className={styles.predictCgpaBtn} onClick={predictCGPA}>
                PREDICT CGPA
              </button>
            </>
          )}

          <div style={{ height: 80 }} />
        </main>
      </div>

      <FloatingButton
        onClick={() => navigate("/cgpaPredictorSummary")}
        icon="trending_up"
        label="SUMMARY"
        gradient="linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)"
      />
    </div>
  );
}

export default CGPAPredictor;
