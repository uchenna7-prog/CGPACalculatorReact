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

function FloatingSummaryButton({ onClick }) {
  const dragging = useRef(false);
  const startPos = useRef({});
  const pos = useRef({ x: null, y: null });
  const [coords, setCoords] = useState({ x: null, y: null });

  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const initial = { x: vw - 80, y: vh / 2 - 32 };
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
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        cursor: "grab",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        zIndex: 1000,
      }}
    >
      <span className="material-icons" style={{ fontSize: "1.5rem", color: "#fff" }}>
        insights
      </span>
      <span style={{ fontSize: "0.5rem", color: "#c8f0d8", fontWeight: 700 }}>
        SUMMARY
      </span>
    </button>
  );
}

function SummaryModal({ semesters, cgpa, onClose }) {
  const honours = getHonours(cgpa);

  const totalCourses = semesters.reduce((sum, s) => sum + s.courses.length, 0);
  const totalUnitsAll = semesters.reduce(
    (sum, s) => sum + s.courses.reduce((u, c) => u + (parseFloat(c.unit) || 0), 0),
    0
  );

  const byYear = semesters.reduce((acc, s) => {
    if (!acc[s.year]) acc[s.year] = [];
    acc[s.year].push(s);
    return acc;
  }, {});

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <span>ACADEMIC SUMMARY</span>
          <button onClick={onClose} style={closeStyle}>✕</button>
        </div>

        <div style={heroStyle}>
          {cgpa !== null ? (
            <>
              <div style={{ fontSize: "3rem", fontWeight: 800, color: "#4caf7d" }}>
                {cgpa.toFixed(2)}
              </div>
              <div>CUMULATIVE GPA</div>
              {honours && (
                <div style={{ marginTop: 10, color: honours.color }}>
                  {honours.emoji} {honours.label}
                </div>
              )}
            </>
          ) : (
            <div>Calculate CGPA to see your classification</div>
          )}
        </div>

        <div style={{ padding: 20 }}>
          <p>Total Semesters: {semesters.length}</p>
          <p>Total Courses: {totalCourses}</p>
          <p>Total Units: {totalUnitsAll}</p>
          <p>Total Years: {Object.keys(byYear).length}</p>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.75)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1001,
};

const modalStyle = {
  background: "#0d1f16",
  borderRadius: 12,
  width: "100%",
  maxWidth: 520,
  overflow: "hidden",
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  padding: 16,
};

const closeStyle = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
};

const heroStyle = {
  padding: 20,
  textAlign: "center",
};

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

    const totalUnits = allCourses.reduce(
      (sum, c) => sum + parseFloat(c.unit),
      0
    );

    const totalPoints = allCourses.reduce(
      (sum, c) => sum + parseFloat(c.unit) * GRADE_POINTS[c.grade],
      0
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
        return {
          ...s,
          courses: s.courses.filter((c) => c.id !== courseId),
          gpa: null,
        };
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

        const totalUnits = s.courses.reduce(
          (sum, c) => sum + parseFloat(c.unit),
          0
        );

        const totalPoints = s.courses.reduce(
          (sum, c) => sum + parseFloat(c.unit) * GRADE_POINTS[c.grade],
          0
        );

        return {
          ...s,
          gpa: totalUnits === 0 ? null : totalPoints / totalUnits,
        };
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
          {Object.entries(byYear).map(([year, yearSemesters]) => (
            <div key={year}>
              <h2 className={styles.yearHeading}>YEAR {year}</h2>

              {yearSemesters.map((sem) => (
                <div key={sem.id}>
                  <h3 className={styles.semesterHeading}>
                    {SEMESTER_NAMES[sem.semesterNum]} Semester
                  </h3>

                  <section className={styles.semesterCard}>
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
                                  updateCourse(
                                    sem.id,
                                    course.id,
                                    "code",
                                    e.target.value.toUpperCase()
                                  )
                                }
                              />
                            </td>

                            <td>
                              <input
                                className={styles.inputField}
                                type="number"
                                value={course.unit}
                                onChange={(e) =>
                                  updateCourse(
                                    sem.id,
                                    course.id,
                                    "unit",
                                    e.target.value
                                  )
                                }
                              />
                            </td>

                            <td>
                              <select
                                className={styles.selectField}
                                value={course.grade}
                                onChange={(e) =>
                                  updateCourse(
                                    sem.id,
                                    course.id,
                                    "grade",
                                    e.target.value
                                  )
                                }
                              >
                                {GRADES.map((g) => (
                                  <option key={g} value={g}>
                                    {g}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td>
                              <button
                                className={styles.deleteRowBtn}
                                onClick={() =>
                                  deleteCourse(sem.id, course.id)
                                }
                              >
                                🗑
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className={styles.semesterControls}>
                      <button onClick={() => addCourse(sem.id)}>
                        ADD COURSE
                      </button>

                      <button onClick={() => deleteAllCourses(sem.id)}>
                        DELETE ALL
                      </button>

                      <button onClick={() => calculateSemesterGPA(sem.id)}>
                        CALCULATE GPA
                      </button>
                    </div>

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
                  </section>
                </div>
              ))}
            </div>
          ))}

          {cgpaError && (
            <p className={styles.errorMsg}>{cgpaError}</p>
          )}

          <div className={styles.cgpaControls}>
            <button onClick={addSemester}>ADD SEMESTER</button>
            <button onClick={removeSemester}>REMOVE LAST SEMESTER</button>
            <button onClick={calculateCGPA}>CALCULATE CGPA</button>
          </div>

          {cgpa !== null && (
            <div className={styles.cgpaResult}>
              CGPA: {cgpa.toFixed(2)}
            </div>
          )}
        </main>

        <FloatingSummaryButton
          onClick={() => setShowSummary(true)}
        />

        {showSummary && (
          <SummaryModal
            semesters={semesters}
            cgpa={cgpa}
            onClose={() => setShowSummary(false)}
          />
        )}
      </div>
    </div>
  );
}

export default Home;