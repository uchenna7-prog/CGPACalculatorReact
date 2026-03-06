import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import SideBar from "../../components/SideBar/SideBar";
import Header from "../../components/Header/Header";
import styles from "./GpaCalculator.module.css";

const GRADES = ["A", "B", "C", "D", "E", "F"];
const GRADE_POINTS = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };

function createCourse() {
  return { id: Date.now() + Math.random(), code: "", unit: "", grade: "A" };
}

function getGpaColor(gpa) {
  if (gpa >= 4.5) return "#fbbf24";
  if (gpa >= 3.5) return "#34d399";
  if (gpa >= 2.4) return "#60a5fa";
  if (gpa >= 1.5) return "#f87171";
  return "#a78bfa";
}

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

// ── GPA Summary Modal ──────────────────────────────────────────────────────
function GpaSummaryModal({ courses, gpa, onClose }) {
  const hasData =
    courses.length > 0 &&
    courses.every((c) => c.unit !== "" && !isNaN(parseFloat(c.unit)));

  const totalUnits = courses.reduce((sum, c) => sum + (parseFloat(c.unit) || 0), 0);

  const gpaDisplay = gpa ?? (() => {
    if (!hasData) return null;
    const pts = courses.reduce((s, c) => s + parseFloat(c.unit) * GRADE_POINTS[c.grade], 0);
    return totalUnits === 0 ? null : pts / totalUnits;
  })();

  const gradeBreakdown = GRADES.map((g) => ({
    grade: g,
    count: courses.filter((c) => c.grade === g).length,
    points: GRADE_POINTS[g],
  })).filter((g) => g.count > 0);

  const gpaColor = gpaDisplay !== null ? getGpaColor(gpaDisplay) : "var(--accentGreen)";

  return createPortal(
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>

        {/* Header */}
        <div style={modalHeaderStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="material-icons" style={{ color: "var(--accentGreen)", fontSize: "1.1rem" }}>grade</span>
            <span style={headerTitleStyle}>GPA SUMMARY</span>
          </div>
          <button onClick={onClose} style={closeStyle}>
            <span className="material-icons" style={{ fontSize: "1.1rem" }}>close</span>
          </button>
        </div>

        {!hasData ? (
          <div style={emptyStyle}>
            <span className="material-icons" style={{ fontSize: "3rem", color: "var(--accentGreen)", opacity: 0.4 }}>
              pending_actions
            </span>
            <p style={emptyTitleStyle}>Nothing to show yet</p>
            <p style={emptySubStyle}>
              Add your courses and fill in the units to see your GPA summary here.
            </p>
          </div>
        ) : (
          <>
            {/* GPA Hero */}
            <div style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "20px",
              background: `${gpaColor}15`,
              borderBottom: `2px solid ${gpaColor}40`,
              flexShrink: 0,
            }}>
              <span style={{ fontSize: "2.8rem", lineHeight: 1 }}>📊</span>
              <div>
                <div style={{
                  fontFamily: "DM Sans, sans-serif", fontSize: "2.8rem",
                  fontWeight: 900, color: gpaColor, lineHeight: 1,
                }}>
                  {gpaDisplay !== null ? gpaDisplay.toFixed(2) : "—"}
                </div>
                <div style={{
                  fontFamily: "Consolas, monospace", fontSize: "0.65rem",
                  color: "var(--accentGreen)", opacity: 0.7, marginTop: 2, letterSpacing: 0.5,
                }}>
                  GPA
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: 8, padding: "14px 16px",
              borderBottom: "1px solid var(--borderColor)", flexShrink: 0,
            }}>
              {[
                { label: "COURSES", value: courses.length },
                { label: "TOTAL UNITS", value: totalUnits },
              ].map(({ label, value }) => (
                <div key={label} style={statCardStyle}>
                  <div style={statValueStyle}>{value}</div>
                  <div style={statLabelStyle}>{label}</div>
                </div>
              ))}
            </div>

            {/* Grade Breakdown */}
            <div style={{ padding: "14px 16px", overflowY: "auto" }}>
              <div style={sectionLabelStyle}>GRADE BREAKDOWN</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                {gradeBreakdown.map(({ grade, count, points }) => {
                  const pct = Math.round((count / courses.length) * 100);
                  const gradeCol = getGpaColor(points);
                  return (
                    <div key={grade} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 6,
                        background: `${gradeCol}25`, border: `1px solid ${gradeCol}50`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "Consolas, monospace", fontWeight: 800,
                        fontSize: "0.9rem", color: gradeCol, flexShrink: 0,
                      }}>
                        {grade}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{
                            fontFamily: "Consolas, monospace", fontSize: "0.68rem",
                            color: "var(--textColor)", opacity: 0.6,
                          }}>
                            {count} course{count !== 1 ? "s" : ""} · {points} pts
                          </span>
                          <span style={{ fontFamily: "Consolas, monospace", fontSize: "0.68rem", color: gradeCol }}>
                            {pct}%
                          </span>
                        </div>
                        <div style={{
                          height: 4, borderRadius: 2,
                          background: "var(--borderColor)", overflow: "hidden",
                        }}>
                          <div style={{
                            width: `${pct}%`, height: "100%",
                            background: gradeCol, borderRadius: 2,
                          }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div style={footerStyle}>Nigerian 5-point scale · A=5 B=4 C=3 D=2 E=1 F=0</div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

// ── Shared modal styles ────────────────────────────────────────────────────
const overlayStyle = {
  position: "fixed", inset: 0,
  background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 10000, padding: 16,
};
const modalStyle = {
  background: "var(--bg)", border: "1px solid var(--borderColor)",
  borderRadius: 14, width: "100%", maxWidth: 420, maxHeight: "88vh",
  display: "flex", flexDirection: "column",
  boxShadow: "0 24px 64px rgba(0,0,0,0.45)", overflow: "hidden",
};
const modalHeaderStyle = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "14px 18px", borderBottom: "1px solid var(--borderColor)",
  background: "#1a2e22", flexShrink: 0,
};
const headerTitleStyle = {
  fontFamily: "Consolas, monospace", fontSize: "0.8rem",
  fontWeight: 700, letterSpacing: 1.5, color: "#a8cfb8",
};
const closeStyle = {
  background: "transparent", border: "none", color: "#a8cfb8",
  cursor: "pointer", display: "flex", alignItems: "center",
  justifyContent: "center", padding: 4, borderRadius: 6, opacity: 0.7,
};
const emptyStyle = {
  display: "flex", flexDirection: "column", alignItems: "center",
  justifyContent: "center", gap: 12, padding: "48px 32px", textAlign: "center",
};
const emptyTitleStyle = {
  fontFamily: "Consolas, monospace", fontSize: "1rem",
  fontWeight: 700, color: "var(--textColor)",
};
const emptySubStyle = {
  fontSize: "0.82rem", color: "var(--textColor)",
  opacity: 0.55, lineHeight: 1.6, maxWidth: 260,
};
const statCardStyle = {
  background: "var(--tableData)", border: "1px solid var(--borderColor)",
  borderRadius: 8, padding: "10px 6px", textAlign: "center",
};
const statValueStyle = {
  fontFamily: "DM Sans, sans-serif", fontSize: "1.4rem",
  fontWeight: 800, color: "var(--accentGreen)",
};
const statLabelStyle = {
  fontFamily: "Consolas, monospace", fontSize: "0.55rem",
  letterSpacing: 0.8, color: "var(--textColor)", opacity: 0.5, marginTop: 3,
};
const sectionLabelStyle = {
  fontFamily: "Consolas, monospace", fontSize: "0.6rem",
  fontWeight: 700, letterSpacing: 2, color: "var(--textColor)",
  opacity: 0.4, textTransform: "uppercase",
};
const footerStyle = {
  padding: "10px 18px", borderTop: "1px solid var(--borderColor)",
  fontFamily: "Consolas, monospace", fontSize: "0.65rem",
  color: "var(--textColor)", opacity: 0.35, flexShrink: 0,
  background: "var(--tableData)",
};

// ── Main Component ─────────────────────────────────────────────────────────
function GPACalculator() {
  const [courses, setCourses] = useState([createCourse()]);
  const [gpa, setGpa] = useState(null);
  const [error, setError] = useState("");
  const [showSummary, setShowSummary] = useState(false);

  const updateCourse = (id, field, value) => {
    setCourses((prev) => prev.map((c) => (c.id !== id ? c : { ...c, [field]: value })));
    setGpa(null); setError("");
  };

  const addCourse = () => { setCourses((prev) => [...prev, createCourse()]); setGpa(null); };
  const deleteCourse = (id) => { setCourses((prev) => prev.filter((c) => c.id !== id)); setGpa(null); };
  const deleteAllCourses = () => { setCourses([]); setGpa(null); setError(""); };

  const calculateGPA = () => {
    if (courses.length === 0) { setError("No courses added."); return; }
    const hasInvalid = courses.some((c) => c.unit === "" || isNaN(parseFloat(c.unit)));
    if (hasInvalid) { setError("Please fill in all course units with valid numbers."); setGpa(null); return; }
    const totalUnits = courses.reduce((sum, c) => sum + parseFloat(c.unit), 0);
    const totalPoints = courses.reduce((sum, c) => sum + parseFloat(c.unit) * GRADE_POINTS[c.grade], 0);
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
                        <input className={styles.inputField} type="text" value={course.code}
                          onChange={(e) => updateCourse(course.id, "code", e.target.value.toUpperCase())} />
                      </td>
                      <td>
                        <input className={styles.inputField} type="number" min="1" max="6" value={course.unit}
                          onChange={(e) => updateCourse(course.id, "unit", e.target.value)} />
                      </td>
                      <td>
                        <select className={styles.selectField} value={course.grade}
                          onChange={(e) => updateCourse(course.id, "grade", e.target.value)}>
                          {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </td>
                      <td>
                        <button className={styles.deleteRowBtn} onClick={() => deleteCourse(course.id)} title="Delete course">
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

            {error && <p className={styles.errorMsg}>{error}</p>}
            {gpa !== null && <div className={styles.gpaResult}>GPA: {gpa.toFixed(2)}</div>}

            <div className={styles.buttonContainer}>
              <button className={styles.addCourseBtn} onClick={addCourse}>ADD COURSE</button>
              <button className={styles.deleteAllBtn} onClick={deleteAllCourses}>DELETE ALL COURSES</button>
              <button className={styles.calcGpaBtn} onClick={calculateGPA}>CALCULATE GPA</button>
            </div>
          </section>

          <div style={{ height: 80 }} />
        </main>
      </div>

      <FloatingButton
        onClick={() => setShowSummary(true)}
        icon="grade"
        label="SUMMARY"
        gradient="linear-gradient(135deg, #f59e0b 0%, #b45309 100%)"
      />

      {showSummary && (
        <GpaSummaryModal
          courses={courses}
          gpa={gpa}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
}

export default GPACalculator;
