import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import SideBar from "../../components/SideBar/SideBar";
import Header from "../../components/Header/Header";
import styles from "./Home.module.css";

const GRADES = ["A", "B", "C", "D", "E", "F"];
const GRADE_POINTS = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };
const SEMESTER_NAMES = { 1: "First", 2: "Second" };

function getHonours(cgpa) {
  if (cgpa === null) return null;
  if (cgpa >= 4.5) return { label: "First Class Honours", color: "#fbbf24", emoji: "🥇" };
  if (cgpa >= 3.5) return { label: "Second Class Upper (2:1)", color: "#34d399", emoji: "🥈" };
  if (cgpa >= 2.4) return { label: "Second Class Lower (2:2)", color: "#60a5fa", emoji: "🥉" };
  if (cgpa >= 1.5) return { label: "Third Class Honours", color: "#f87171", emoji: "📋" };
  return { label: "Pass", color: "#a78bfa", emoji: "📄" };
}

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

// ── Summary Modal ─────────────────────────────────────────────────────────
function SummaryModal({ semesters, cgpa, onClose }) {
  const honours = getHonours(cgpa);

  // Check if there is anything meaningful to show
  const hasData = cgpa !== null || semesters.some(
    (s) => s.gpa !== null && s.gpa !== "error"
  );

  // Compute per-semester GPAs (auto-calc even if user hasn't hit Calculate GPA)
  const computedSemesters = semesters.map((s) => {
    const valid = s.courses.length > 0 && s.courses.every(
      (c) => c.unit !== "" && !isNaN(parseFloat(c.unit))
    );
    if (!valid) return { ...s, computedGpa: null };
    const totalUnits = s.courses.reduce((sum, c) => sum + parseFloat(c.unit), 0);
    const totalPoints = s.courses.reduce(
      (sum, c) => sum + parseFloat(c.unit) * GRADE_POINTS[c.grade], 0
    );
    return { ...s, computedGpa: totalUnits === 0 ? null : totalPoints / totalUnits };
  });

  const byYear = computedSemesters.reduce((acc, s) => {
    if (!acc[s.year]) acc[s.year] = [];
    acc[s.year].push(s);
    return acc;
  }, {});

  const totalCourses = semesters.reduce((sum, s) => sum + s.courses.length, 0);
  const totalUnitsAll = semesters.reduce(
    (sum, s) => sum + s.courses.reduce((u, c) => u + (parseFloat(c.unit) || 0), 0), 0
  );
  const totalYears = Object.keys(byYear).length;

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-surface" style={modalStyle}>

        {/* ── Header ── */}
        <div className="modal-header-bar" style={modalHeaderStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="material-icons" style={{ color: "var(--accentGreen)", fontSize: "1.2rem" }}>
              insights
            </span>
            <span style={headerTitleStyle}>ACADEMIC SUMMARY</span>
          </div>
          <button onClick={onClose} style={closeStyle} title="Close">
            <span className="material-icons" style={{ fontSize: "1.1rem" }}>close</span>
          </button>
        </div>

        {!hasData ? (
          /* ── Empty State ── */
          <div style={emptyStateStyle}>
            <span className="material-icons" style={{ fontSize: "3rem", color: "var(--accentGreen)", opacity: 0.5 }}>
              pending_actions
            </span>
            <p style={emptyTitleStyle}>Nothing to show yet</p>
            <p style={emptySubStyle}>
              Add your courses, then calculate GPA for each semester and your CGPA to see your full academic summary here.
            </p>
          </div>
        ) : (
          <>
            {/* ── Honours Badge ── */}
            {honours && (
              <div style={honoursBannerStyle(honours.color)}>
                <span style={{ fontSize: "2.8rem", lineHeight: 1 }}>{honours.emoji}</span>
                <div>
                  <div style={cgpaValueStyle}>{cgpa.toFixed(2)}</div>
                  <div style={{ fontFamily: "Consolas, monospace", fontSize: "0.65rem", color: "var(--accentGreen)", opacity: 0.7, marginTop: 2, letterSpacing: 0.5 }}>CGPA</div>
                  <div style={honoursLabelStyle}>{honours.label}</div>
                </div>
              </div>
            )}
            {cgpa !== null && !honours && (
              <div style={honoursBannerStyle("#a78bfa")}>
                <span style={{ fontSize: "1.6rem" }}>📄</span>
                <div>
                  <div style={honoursLabelStyle}>Pass</div>
                  <div style={cgpaValueStyle}>CGPA: {cgpa.toFixed(2)}</div>
                </div>
              </div>
            )}

            {/* ── Stats Grid ── */}
            <div style={statsGridStyle}>
              {[
                { label: "YEARS", value: totalYears },
                { label: "SEMESTERS", value: semesters.length },
                { label: "COURSES", value: totalCourses },
                { label: "TOTAL UNITS", value: totalUnitsAll },
              ].map(({ label, value }) => (
                <div key={label} className="card-surface" style={statCardStyle}>
                  <div style={statValueStyle}>{value}</div>
                  <div style={statLabelStyle}>{label}</div>
                </div>
              ))}
            </div>

            {/* ── Per-Semester Breakdown ── */}
            <div style={semesterListStyle}>
              {Object.entries(byYear).map(([year, yearSems]) => (
                <div key={year}>
                  <div style={yearChipStyle}>YEAR {year}</div>
                  {yearSems.map((sem) => {
                    const gpaVal =
                      sem.gpa !== null && sem.gpa !== "error"
                        ? sem.gpa
                        : sem.computedGpa;
                    const semUnits = sem.courses.reduce(
                      (u, c) => u + (parseFloat(c.unit) || 0), 0
                    );
                    return (
                      <div key={sem.id} className="card-surface" style={semCardStyle}>
                        <div style={semTopRowStyle}>
                          <span style={semNameStyle}>
                            {SEMESTER_NAMES[sem.semesterNum]} Semester
                          </span>
                          <span style={{
                            ...semGpaStyle,
                            color: gpaVal !== null ? getGpaColor(gpaVal) : "var(--textColor)",
                            opacity: gpaVal !== null ? 1 : 0.35,
                          }}>
                            {gpaVal !== null ? gpaVal.toFixed(2) : "—"}
                          </span>
                        </div>
                        <div style={semMetaRowStyle}>
                          <span style={semMetaStyle}>
                            <span className="material-icons" style={{ fontSize: "0.75rem", verticalAlign: "middle" }}>book</span>
                            {" "}{sem.courses.length} courses
                          </span>
                          <span style={semMetaStyle}>
                            <span className="material-icons" style={{ fontSize: "0.75rem", verticalAlign: "middle" }}>straighten</span>
                            {" "}{semUnits} units
                          </span>
                          {gpaVal !== null && (
                            <span style={{ ...semMetaStyle, marginLeft: "auto" }}>
                              <GpaBar gpa={gpaVal} />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* ── Footer ── */}
            <div style={footerStyle}>
              Nigerian 5-point scale · A=5 B=4 C=3 D=2 E=1 F=0
            </div>
          </>
        )}

      </div>
    </div>
  );
}

// Small GPA progress bar
function GpaBar({ gpa }) {
  const pct = Math.min((gpa / 5) * 100, 100);
  const color = getGpaColor(gpa);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{
        display: "inline-block",
        width: 48,
        height: 4,
        borderRadius: 2,
        background: "var(--borderColor)",
        overflow: "hidden",
      }}>
        <span style={{
          display: "block",
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: 2,
        }} />
      </span>
    </span>
  );
}

function getGpaColor(gpa) {
  if (gpa >= 4.5) return "#fbbf24";
  if (gpa >= 3.5) return "#34d399";
  if (gpa >= 2.4) return "#60a5fa";
  if (gpa >= 1.5) return "#f87171";
  return "#a78bfa";
}

// ── Modal styles (use CSS variables for theme awareness) ──────────────────
const overlayStyle = {
  position: "fixed", inset: 0,
  background: "rgba(0,0,0,0.55)",
  backdropFilter: "blur(6px)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1001, padding: 16,
};
const modalStyle = {
  background: "var(--bg)",
  border: "1px solid var(--borderColor)",
  borderRadius: 14,
  width: "100%", maxWidth: 480,
  maxHeight: "88vh",
  display: "flex", flexDirection: "column",
  boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
  overflow: "hidden",
};
const modalHeaderStyle = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "14px 18px",
  borderBottom: "1px solid var(--borderColor)",
  background: "#1a2e22",
  color:"#a8cfb8",
  flexShrink: 0,
};
const headerTitleStyle = {
  fontFamily: "Consolas, monospace",
  fontSize: "0.8rem",
  fontWeight: 700,
  letterSpacing: 1.5,
  color:"#a8cfb8",
};
const closeStyle = {
  background: "transparent", border: "none",
  color:"#a8cfb8", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: 4, borderRadius: 6,
  opacity: 0.6,
};
const emptyStateStyle = {
  display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center",
  gap: 12, padding: "48px 32px",
  textAlign: "center",
};
const emptyTitleStyle = {
  fontFamily: "Consolas, monospace",
  fontSize: "1rem", fontWeight: 700,
  color: "var(--textColor)",
};
const emptySubStyle = {
  fontSize: "0.82rem",
  color: "var(--textColor)",
  opacity: 0.55,
  lineHeight: 1.6,
  maxWidth: 280,
};
const honoursBannerStyle = (color) => ({
  display: "flex", alignItems: "center", gap: 18,
  padding: "22px 20px",
  background: `${color}18`,
  borderBottom: `2px solid ${color}44`,
  flexShrink: 0,
});
const honoursLabelStyle = {
  fontFamily: "Consolas, monospace",
  fontWeight: 700, fontSize: "0.78rem",
  color: "var(--textColor)",
  letterSpacing: 1,
  opacity: 0.75,
  textTransform: "uppercase",
  marginBottom: 4,
};
const cgpaValueStyle = {
  fontFamily: "Consolas, monospace",
  fontSize: "2.8rem",
  fontWeight: 900,
  color: "var(--accentGreen)",
  lineHeight: 1,
};
const statsGridStyle = {
  display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
  gap: 8, padding: "14px 16px",
  borderBottom: "1px solid var(--borderColor)",
  flexShrink: 0,
};
const statCardStyle = {
  padding: "10px 6px",
  textAlign: "center",
  borderRadius: 8,
};
const statValueStyle = {
  fontFamily: "Consolas, monospace",
  fontSize: "1.35rem", fontWeight: 800,
  color: "var(--accentGreen)",
};
const statLabelStyle = {
  fontFamily: "Consolas, monospace",
  fontSize: "0.55rem", letterSpacing: 0.8,
  color: "var(--textColor)", opacity: 0.5,
  marginTop: 3,
};
const semesterListStyle = {
  overflowY: "auto",
  padding: "12px 16px 16px",
  display: "flex", flexDirection: "column", gap: 6,
};
const yearChipStyle = {
  fontFamily: "Consolas, monospace",
  fontSize: "0.6rem", fontWeight: 700,
  letterSpacing: 2, color: "var(--accentGreen)",
  opacity: 0.7, marginBottom: 4, marginTop: 6,
};
const semCardStyle = {
  padding: "10px 14px",
  borderRadius: 8,
};
const semTopRowStyle = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
};
const semNameStyle = {
  fontFamily: "Consolas, monospace",
  fontSize: "0.82rem", fontWeight: 600,
  color: "var(--textColor)",
};
const semGpaStyle = {
  fontFamily: "Consolas, monospace",
  fontSize: "1.1rem", fontWeight: 800,
};
const semMetaRowStyle = {
  display: "flex", alignItems: "center",
  gap: 10, marginTop: 5,
};
const semMetaStyle = {
  fontFamily: "Consolas, monospace",
  fontSize: "0.68rem",
  color: "var(--textColor)", opacity: 0.55,
  display: "flex", alignItems: "center", gap: 2,
};
const footerStyle = {
  padding: "10px 18px",
  borderTop: "1px solid var(--borderColor)",
  fontFamily: "Consolas, monospace",
  fontSize: "0.65rem",
  color: "var(--textColor)", opacity: 0.35,
  flexShrink: 0,
  background: "var(--tableData)",
};

// ── Main Component ─────────────────────────────────────────────────────────
function Home() {
  const [semesters, setSemesters] = useState([createSemester(1, 1)]);
  const [cgpa, setCgpa] = useState(null);
  const [cgpaError, setCgpaError] = useState("");
  const [showSummary, setShowSummary] = useState(false);

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
      (sum, c) => sum + parseFloat(c.unit) * GRADE_POINTS[c.grade], 0
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
        return { ...s, courses: s.courses.filter((c) => c.id !== courseId), gpa: null };
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
          (sum, c) => sum + parseFloat(c.unit) * GRADE_POINTS[c.grade], 0
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
      <FloatingSummaryButton onClick={() => setShowSummary(true)} />

      {/* Summary modal */}
      {showSummary && (
        <SummaryModal
          semesters={semesters}
          cgpa={cgpa}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
}

export default Home;
