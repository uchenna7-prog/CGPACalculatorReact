import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import SideBar from "../../components/SideBar/SideBar";
import Header from "../../components/Header/Header";
import styles from "./GpaCalculator.module.css";
import { useGpaCalculator } from "../../contexts/GpaCalculatorContext";
import { useSettings } from "../../contexts/SettingsContext"; // Added

// ── Draggable Floating Button ──────────────────────────────────────────────
function FloatingButton({ onClick, icon, label, gradient }) {
  const btnRef = useRef(null);
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
function GPACalculator() {
  const navigate = useNavigate();
  
  // Use both Contexts
  const {
    courses, gpa, error,
    updateCourse, addCourse, deleteCourse, deleteAllCourses, calculateGPA,
  } = useGpaCalculator();

  const { 
    showGradePoints, 
    showCreditSummary, 
    availableGrades, 
    gradePoints,
    decimalPlaces 
  } = useSettings();

  // Calculate totals for the Credit Summary Row
  const totalUnits = courses.reduce((sum, c) => sum + (Number(c.unit) || 0), 0);
  const totalPoints = courses.reduce((sum, c) => sum + (Number(c.unit) || 0) * gradePoints(c.grade), 0);

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
                    <th>UNITS</th>
                    <th>GRADE</th>
                    {showGradePoints && <th>TCU</th>}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course, idx) => (
                    <tr key={course.id}>
                      <td>{idx + 1}</td>
                      <td>
                        <input className={styles.inputField} type="text" value={course.code}
                          placeholder="MAT101"
                          onChange={(e) => updateCourse(course.id, "code", e.target.value.toUpperCase())} />
                      </td>
                      <td>
                        <input className={styles.inputField} type="number" min="1" max="6" value={course.unit}
                          onChange={(e) => updateCourse(course.id, "unit", e.target.value)} />
                      </td>
                      <td>
                        <select className={styles.selectField} value={course.grade}
                          onChange={(e) => updateCourse(course.id, "grade", e.target.value)}>
                          {availableGrades.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </td>
                      {showGradePoints && (
                        <td className={styles.tcuCell}>
                          {(Number(course.unit) || 0) * gradePoints(course.grade)}
                        </td>
                      )}
                      <td>
                        <button className={styles.deleteRowBtn} onClick={() => deleteCourse(course.id)} title="Delete course">
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                
                {/* ── Credit Unit Summary Row ── */}
                {showCreditSummary && courses.length > 0 && (
                  <tfoot className={styles.tableFooter}>
                    <tr>
                      <td colSpan="2" style={{ textAlign: 'right', fontWeight: 'bold' }}>TOTALS:</td>
                      <td style={{ fontWeight: 'bold' }}>{totalUnits}</td>
                      <td></td>
                      {showGradePoints && <td style={{ fontWeight: 'bold' }}>{totalPoints}</td>}
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            ) : (
              <p className={styles.noCoursesMsg}>No courses added.</p>
            )}

            {error && <p className={styles.errorMsg}>{error}</p>}
            {gpa !== null && (
              <div className={styles.gpaResult}>
                GPA: {gpa.toFixed(Number(decimalPlaces))}
              </div>
            )}

            <div className={styles.buttonContainer}>
              <button className={styles.addCourseBtn} onClick={addCourse}>ADD COURSE</button>
              <button className={styles.deleteAllBtn} onClick={deleteAllCourses}>DELETE ALL</button>
              <button className={styles.calcGpaBtn} onClick={calculateGPA}>CALCULATE</button>
            </div>
          </section>

          <div style={{ height: 80 }} />
        </main>
      </div>

      <FloatingButton
        onClick={() => navigate("/gpaCalculatorSummary")}
        icon="grade"
        label="SUMMARY"
        gradient="linear-gradient(135deg, #f59e0b 0%, #b45309 100%)"
      />
    </div>
  );
}

export default GPACalculator;
