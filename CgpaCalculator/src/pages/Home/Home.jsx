import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import SideBar from "../../components/SideBar/SideBar";
import Header from "../../components/Header/Header";
import styles from "./Home.module.css";
import { useGpa } from "../../contexts/GpaContext";
import { useSettings } from "../../contexts/SettingsContext";

const SEMESTER_NAMES = { 1: "First", 2: "Second" };

function getHonours(cgpa) {
  if (cgpa === null) return null;
  if (cgpa >= 4.5) return { label: "First Class Honours",      color: "#fbbf24", emoji: "🥇" };
  if (cgpa >= 3.5) return { label: "Second Class Upper (2:1)", color: "#34d399", emoji: "🥈" };
  if (cgpa >= 2.4) return { label: "Second Class Lower (2:2)", color: "#60a5fa", emoji: "🥉" };
  if (cgpa >= 1.5) return { label: "Third Class Honours",      color: "#f87171", emoji: "📋" };
  return           { label: "Pass",                            color: "#a78bfa", emoji: "📄" };
}

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
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 3, zIndex: 9999,
        userSelect: "none", touchAction: "none",
      }}
    >
      <span className="material-icons"
        style={{ fontSize: "1.5rem", color: "#fff", pointerEvents: "none" }}>
        insights
      </span>
      <span style={{
        fontSize: "0.5rem", color: "#c8f0d8",
        fontFamily: "Consolas, monospace", fontWeight: 700,
        letterSpacing: 0.5, pointerEvents: "none",
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

  const {
    decimalPlaces,
    showGradePoints,
    showCreditSummary,
    confirmDelete,
    gradePoints,
    availableGrades,
  } = useSettings();

  const dp = Number(decimalPlaces);

  // ── Refs for scroll-into-view ──
  const semCardRefs    = useRef({});
  const cgpaResultRef  = useRef(null);
  const [scrollToSemId,       setScrollToSemId]       = useState(null);
  const [shouldScrollToCgpa,  setShouldScrollToCgpa]  = useState(false);

  // Scroll to semester card after GPA calculated
  useEffect(() => {
    if (scrollToSemId == null) return;
    const el = semCardRefs.current[scrollToSemId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setScrollToSemId(null);
  }, [semesters, scrollToSemId]);

  // Scroll to CGPA result after it renders
  useEffect(() => {
    if (!shouldScrollToCgpa) return;
    if (cgpaResultRef.current) {
      cgpaResultRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setShouldScrollToCgpa(false);
  }, [cgpa, shouldScrollToCgpa]);

  const handleDeleteCourse = (semId, courseId) => {
    if (confirmDelete && !window.confirm("Delete this course?")) return;
    deleteCourse(semId, courseId);
  };

  const handleDeleteAllCourses = (semId) => {
    if (confirmDelete && !window.confirm("Delete all courses in this semester?")) return;
    deleteAllCourses(semId);
  };

  const handleCalculateGPA = (semId) => {
    calculateSemesterGPA(semId);
    setScrollToSemId(semId);
  };

  const handleCalculateCGPA = () => {
    calculateCGPA();
    setShouldScrollToCgpa(true);
  };

  const getSemesterSummary = (courses) => {
    const totalUnits     = courses.reduce((s, c) => s + (Number(c.unit) || 0), 0);
    const weightedPoints = courses.reduce(
      (s, c) => s + (Number(c.unit) || 0) * gradePoints(c.grade), 0
    );
    return { totalUnits, weightedPoints };
  };

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
          <div className={styles.page}>

            {/* CGPA Result Card */}
            {cgpa !== null && (
              <div className={styles.cgpaResultCard} ref={cgpaResultRef}>
                <div className={styles.cgpaResultLeft}>
                  <div className={styles.cgpaResultLabel}>Cumulative GPA</div>
                  <div className={styles.cgpaResultValue}>{cgpa.toFixed(dp)}</div>
                  {honours && (
                    <div className={styles.cgpaHonours} style={{ color: honours.color }}>
                      {honours.label}
                    </div>
                  )}
                </div>
                {honours && <div className={styles.cgpaEmoji}>{honours.emoji}</div>}
              </div>
            )}

            {cgpaError && (
              <p className={styles.errorMsg}>{cgpaError}</p>
            )}

            {/* Semesters grouped by year */}
            {Object.entries(byYear).map(([year, yearSemesters]) => (
              <div key={year} className={styles.yearBlock}>

                {/* Year Label */}
                <div className={styles.yearLabel}>Year {year}</div>

                {yearSemesters.map((sem) => {
                  const { totalUnits, weightedPoints } = getSemesterSummary(sem.courses);
                  const gpaVisible = sem.gpa !== null && sem.gpa !== "error";
                  const gpaIsError = sem.gpa === "error";

                  return (
                    <div
                      key={sem.id}
                      className={styles.semesterCard}
                      ref={(el) => { semCardRefs.current[sem.id] = el; }}
                    >
                      {/* Semester Header */}
                      <div className={styles.semesterHeader}>
                        <span className={styles.semesterTitle}>
                          {SEMESTER_NAMES[sem.semesterNum]} Semester
                        </span>
                        <span
                          className={[
                            styles.semesterGpaPill,
                            gpaVisible ? styles.visible : "",
                            gpaIsError ? styles.error  : "",
                          ].join(" ")}
                        >
                          {gpaIsError
                            ? "Check inputs"
                            : gpaVisible
                            ? `GPA: ${sem.gpa.toFixed(dp)}`
                            : ""}
                        </span>
                      </div>

                      {/* Courses Table */}
                      <div className={styles.coursesTableWrap}>
                        {sem.courses.length > 0 ? (
                          <table className={styles.table}>
                            <thead>
                              <tr>
                                <th className={styles.colSn} style={{ textAlign: "center" }}>S/N</th>
                                <th className={styles.colCode}>CODE</th>
                                <th className={styles.colUnits} style={{ textAlign: "center" }}>UNITS</th>
                                <th className={styles.colGrade} style={{ textAlign: "center" }}>GRADE</th>
                                {showGradePoints && (
                                  <th className={styles.colTcu} style={{ textAlign: "center" }}>TCU</th>
                                )}
                                <th className={styles.colDel}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {sem.courses.map((course, idx) => (
                                <tr key={course.id}>
                                  <td className={styles.cellSn}>{idx + 1}</td>
                                  <td>
                                    <input
                                      className={styles.inputField}
                                      type="text"
                                      placeholder="e.g. ENG 301"
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
                                      placeholder="e.g. 3"
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
                                  {showGradePoints && (
                                    <td className={styles.cellTcu}>
                                      {(Number(course.unit) || 0) * gradePoints(course.grade)}
                                    </td>
                                  )}
                                  <td className={styles.cellDel}>
                                    <button
                                      className={styles.deleteRowBtn}
                                      onClick={() => handleDeleteCourse(sem.id, course.id)}
                                      title="Remove course"
                                    >
                                      <i className="fa-solid fa-xmark"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>

                            {showCreditSummary && (
                              <tfoot>
                                <tr className={styles.summaryRow}>
                                  <td colSpan={2} style={{ textAlign: "left" }}>TOTAL</td>
                                  <td style={{ textAlign: "left" }}><strong>{totalUnits}</strong></td>
                                  <td></td>
                                  {showGradePoints && (
                                    <td style={{ textAlign: "center" }}><strong>{weightedPoints}</strong></td>
                                  )}
                                  <td></td>
                                </tr>
                              </tfoot>
                            )}
                          </table>
                        ) : (
                          <p className={styles.noCoursesMsg}>
                            <i className="fa-regular fa-circle-dot"></i> No courses added yet.
                          </p>
                        )}
                      </div>

                      {/* Semester Controls */}
                      <div className={styles.semesterControls}>
                        <button
                          className={styles.addCourseBtn}
                          onClick={() => addCourse(sem.id)}
                        >
                          <i className="fa-solid fa-plus"></i> Add Course
                        </button>
                        <button
                          className={styles.deleteAllBtn}
                          onClick={() => handleDeleteAllCourses(sem.id)}
                        >
                          <i className="fa-solid fa-trash"></i> Delete All
                        </button>
                        <button
                          className={styles.calcGpaBtn}
                          onClick={() => handleCalculateGPA(sem.id)}
                        >
                          <i className="fa-solid fa-equals"></i> Calculate GPA
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Manage Semesters / CGPA Controls */}
            <div className={styles.cgpaControlsWrap}>
              <div className={styles.cgpaControlsLabel}>Manage Semesters</div>
              <div className={styles.cgpaControls}>
                <button className={styles.addSemBtn} onClick={addSemester}>
                  <i className="fa-solid fa-plus"></i> Add Semester
                </button>
                <button
                  className={styles.removeSemBtn}
                  onClick={removeSemester}
                  disabled={semesters.length === 1}
                >
                  <i className="fa-solid fa-minus"></i> Remove Last
                </button>
                <button className={styles.calcCgpaBtn} onClick={handleCalculateCGPA}>
                  <i className="fa-solid fa-chart-simple"></i> Calculate CGPA
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>

      <FloatingSummaryButton onClick={() => navigate("/summary")} />
    </div>
  );
}

export default Home;
