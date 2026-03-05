import { useState, useRef, useEffect } from "react";
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
  const pos = useRef({ x: null, y: null });
  const [coords, setCoords] = useState({ x: null, y: null });

  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const initial = { x: vw - 80, y: vh - 75 };
    pos.current = initial;
    setCoords(initial);
  }, []);

  const onPointerDown = (e) => {
    dragging.current = false;
    startPos.current = {
      px: e.clientX,
      py: e.clientY,
      bx: pos.current.x,
      by: pos.current.y,
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
    pos.current = { x: newX, y: newY };
    setCoords({ x: newX, y: newY });
  };

  const onPointerUp = () => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    if (!dragging.current) onClick();
  };

  if (coords.x === null) return null;

  return (
    <button
      ref={btnRef}
      onPointerDown={onPointerDown}
      title="View Summary"
      style={{
        position: "fixed",
        left: coords.x,
        top: coords.y,
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
        zIndex: 1000,
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
    </button>
  );
}

// ── Summary Modal ─────────────────────────────────────────────────────────
function SummaryModal({ semesters, cgpa, onClose }) {
  const honours = getHonours(cgpa);

  const computedSemesters = semesters.map((s) => {
    const valid = s.courses.every((c) => c.unit !== "" && !isNaN(parseFloat(c.unit)));
    if (!valid || s.courses.length === 0) return { ...s, computedGpa: null };
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

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>

        {/* Header */}
        <div style={modalHeaderStyle}>
          <span style={{ fontSize: "1.1rem", fontWeight: 700, letterSpacing: 1, fontFamily: "Consolas, monospace", color: "#a8cfb8" }}>
            ACADEMIC SUMMARY
          </span>
          <button onClick={onClose} style={closeStyle}>✕</button>
        </div>

        {/* CGPA Hero */}
        <div style={heroStyle}>
          {cgpa !== null ? (
            <>
              <div style={{ fontSize: "3rem", fontWeight: 800, color: "#4caf7d", fontFamily: "Consolas, monospace", lineHeight: 1 }}>
                {cgpa.toFixed(2)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#5a8a6a", marginTop: 4, letterSpacing: 1, fontFamily: "Consolas, monospace" }}>
                CUMULATIVE GPA
              </div>
              {honours && (
                <div style={{
                  marginTop: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(76,175,125,0.12)",
                  border: `1px solid ${honours.color}55`,
                  borderRadius: 20,
                  padding: "6px 16px",
                }}>
                  <span style={{ fontSize: "1rem" }}>{honours.emoji}</span>
                  <span style={{ color: honours.color, fontWeight: 700, fontSize: "0.85rem", fontFamily: "Consolas, monospace" }}>
                    {honours.label}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div style={{ color: "#5a8a6a", fontSize: "0.85rem", fontFamily: "Consolas, monospace" }}>
              Calculate CGPA to see your classification
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div style={statsRowStyle}>
          <div style={statBoxStyle}>
            <div style={statNumStyle}>{semesters.length}</div>
            <div style={statLabelStyle}>SEMESTERS</div>
          </div>
          <div style={statBoxStyle}>
            <div style={statNumStyle}>{totalCourses}</div>
            <div style={statLabelStyle}>COURSES</div>
          </div>
          <div style={statBoxStyle}>
            <div style={statNumStyle}>{totalUnitsAll}</div>
            <div style={statLabelStyle}>TOTAL UNITS</div>
          </div>
          <div style={statBoxStyle}>
            <div style={statNumStyle}>{Object.keys(byYear).length}</div>
            <div style={statLabelStyle}>YEARS</div>
          </div>
        </div>

        {/* Per-semester breakdown */}
        <div style={{ overflowY: "auto", maxHeight: 300, padding: "12px 20px 16px" }}>
          {Object.entries(byYear).map(([year, yearSems]) => (
            <div key={year} style={{ marginBottom: 12 }}>
              <div style={yearLabelStyle}>YEAR {year}</div>
              {yearSems.map((sem) => {
                const gpaVal =
                  sem.gpa !== null && sem.gpa !== "error"
                    ? sem.gpa
                    : sem.computedGpa;
                const semUnits = sem.courses.reduce((u, c) => u + (parseFloat(c.unit) || 0), 0);
                return (
                  <div key={sem.id} style={semRowStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "Consolas, monospace", fontSize: "0.82rem", color: "#a8cfb8" }}>
                        {SEMESTER_NAMES[sem.semesterNum]} Semester
                      </span>
                      <span style={{
                        fontFamily: "Consolas, monospace",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: gpaVal !== null ? getGpaColor(gpaVal) : "#5a8a6a",
                      }}>
                        {gpaVal !== null ? `GPA: ${gpaVal.toFixed(2)}` : "—"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                      <span style={semStatStyle}>{sem.courses.length} courses</span>
                      <span style={semStatStyle}>{semUnits} units</span>
                    </div>
                    {sem.courses.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                        {sem.courses.map((c) => (
                          <span key={c.id} style={courseTagStyle}>
                            {c.code || "—"} ({c.unit || "?"}) {c.grade}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #1e2e26", fontSize: "0.72rem", color: "#3a7a58", fontFamily: "Consolas, monospace" }}>
          Based on Nigerian 5-point grading scale · A=5, B=4, C=3, D=2, E=1, F=0
        </div>

      </div>
    </div>
  );
}

function getGpaColor(gpa) {
  if (gpa >= 4.5) return "#fbbf24";
  if (gpa >= 3.5) return "#34d399";
  if (gpa >= 2.4) return "#60a5fa";
  if (gpa >= 1.5) return "#f87171";
  return "#a78bfa";
}

// ── Modal inline styles ────────────────────────────────────────────────────
const overlayStyle = {
  position: "fixed", inset: 0,
  background: "rgba(0,0,0,0.75)",
  backdropFilter: "blur(4px)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1001, padding: 16,
};
const modalStyle = {
  background: "#0d1f16",
  border: "1px solid #1e2e26",
  borderRadius: 12,
  width: "100%", maxWidth: 520,
  maxHeight: "90vh",
  display: "flex", flexDirection: "column",
  boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
  overflow: "hidden",
};
const modalHeaderStyle = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "16px 20px",
  borderBottom: "1px solid #1e2e26",
  background: "#0a1a10",
};
const closeStyle = {
  background: "transparent", border: "none",
  color: "#5a8a6a", cursor: "pointer",
  fontSize: "1rem", padding: "2px 6px",
  borderRadius: 4,
};
const heroStyle = {
  padding: "24px 20px 16px",
  textAlign: "center",
  borderBottom: "1px solid #1e2e26",
  background: "linear-gradient(180deg, #0a1a10 0%, #0d1f16 100%)",
};
const statsRowStyle = {
  display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
  gap: 1,
  borderBottom: "1px solid #1e2e26",
  background: "#1e2e26",
};
const statBoxStyle = {
  background: "#0d1f16", padding: "14px 8px",
  textAlign: "center",
};
const statNumStyle = {
  fontFamily: "Consolas, monospace", fontSize: "1.4rem",
  fontWeight: 800, color: "#4caf7d",
};
const statLabelStyle = {
  fontSize: "0.6rem", color: "#3a7a58",
  fontFamily: "Consolas, monospace", marginTop: 2, letterSpacing: 0.5,
};
const yearLabelStyle = {
  fontSize: "0.65rem", fontWeight: 700,
  color: "#3a7a58", letterSpacing: 2,
  fontFamily: "Consolas, monospace",
  marginBottom: 6, marginTop: 4,
};
const semRowStyle = {
  background: "#0a1a10",
  border: "1px solid #1e2e26",
  borderRadius: 6,
  padding: "10px 12px",
  marginBottom: 6,
};
const semStatStyle = {
  fontSize: "0.7rem", color: "#3a7a58",
  fontFamily: "Consolas, monospace",
};
const courseTagStyle = {
  background: "#1a2e22", border: "1px solid #1e2e26",
  borderRadius: 4, padding: "2px 6px",
  fontSize: "0.65rem", color: "#7ab898",
  fontFamily: "Consolas, monospace",
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
