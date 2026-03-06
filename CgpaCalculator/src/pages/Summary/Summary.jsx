import SideBar from "../../components/SideBar/SideBar";
import Header from "../../components/Header/Header";
import styles from "./Summary.module.css";

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

function getGpaColor(gpa) {
  if (gpa >= 4.5) return "#fbbf24";
  if (gpa >= 3.5) return "#34d399";
  if (gpa >= 2.4) return "#60a5fa";
  if (gpa >= 1.5) return "#f87171";
  return "#a78bfa";
}

function GpaBar({ gpa }) {
  const pct = Math.min((gpa / 5) * 100, 100);
  const color = getGpaColor(gpa);
  return (
    <div className={styles.gpaBarTrack}>
      <div
        className={styles.gpaBarFill}
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function Summary({ semesters, cgpa }) {
  const honours = getHonours(cgpa);

  // Show data if CGPA is calculated, OR if any semester has valid courses
  // (computedSemesters auto-calculates GPA from course data so we just need courses)
  const hasData =
    cgpa !== null ||
    semesters.some(
      (s) =>
        s.courses.length > 0 &&
        s.courses.every((c) => c.unit !== "" && !isNaN(parseFloat(c.unit)))
    );

  const computedSemesters = semesters.map((s) => {
    const valid =
      s.courses.length > 0 &&
      s.courses.every((c) => c.unit !== "" && !isNaN(parseFloat(c.unit)));
    if (!valid) return { ...s, computedGpa: null };
    const totalUnits = s.courses.reduce((sum, c) => sum + parseFloat(c.unit), 0);
    const totalPoints = s.courses.reduce(
      (sum, c) => sum + parseFloat(c.unit) * GRADE_POINTS[c.grade],
      0
    );
    return {
      ...s,
      computedGpa: totalUnits === 0 ? null : totalPoints / totalUnits,
    };
  });

  const byYear = computedSemesters.reduce((acc, s) => {
    if (!acc[s.year]) acc[s.year] = [];
    acc[s.year].push(s);
    return acc;
  }, {});

  const totalCourses = semesters.reduce((sum, s) => sum + s.courses.length, 0);
  const totalUnitsAll = semesters.reduce(
    (sum, s) =>
      sum + s.courses.reduce((u, c) => u + (parseFloat(c.unit) || 0), 0),
    0
  );
  const totalYears = Object.keys(byYear).length;

  return (
    <div className={styles.pageContainer}>
      <SideBar />
      <div className={styles.mainWrapper}>
        <Header />
        <main className={styles.mainContent}>

          {!hasData ? (
            /* ── Empty State ── */
            <div className={styles.emptyState}>
              <span className="material-icons" style={{ fontSize: "4rem", color: "var(--accentGreen)", opacity: 0.4 }}>
                pending_actions
              </span>
              <h2 className={styles.emptyTitle}>Nothing to show yet</h2>
              <p className={styles.emptySub}>
                Go to the calculator, add your courses and calculate your GPA
                for each semester and your CGPA — then come back here to see
                your full academic summary.
              </p>
            </div>
          ) : (
            <>
              {/* ── Honours Hero Banner ── */}
              {honours && (
                <div
                  className={styles.honoursBanner}
                  style={{
                    background: `${honours.color}15`,
                    borderColor: `${honours.color}40`,
                  }}
                >
                  <span className={styles.honoursEmoji}>{honours.emoji}</span>
                  <div className={styles.honoursMeta}>
                    <div className={styles.cgpaNumber} style={{ color: "var(--accentGreen)" }}>
                      {cgpa.toFixed(2)}
                    </div>
                    <div className={styles.cgpaLabel}>CGPA</div>
                    <div className={styles.honoursLabel} style={{ color: honours.color }}>
                      {honours.label}
                    </div>
                  </div>
                </div>
              )}

              {/* fallback if cgpa exists but getHonours returned null (shouldn't happen but just in case) */}
              {cgpa !== null && !honours && (
                <div
                  className={styles.honoursBanner}
                  style={{ background: "#a78bfa15", borderColor: "#a78bfa40" }}
                >
                  <span className={styles.honoursEmoji}>📄</span>
                  <div className={styles.honoursMeta}>
                    <div className={styles.cgpaNumber} style={{ color: "var(--accentGreen)" }}>
                      {cgpa.toFixed(2)}
                    </div>
                    <div className={styles.cgpaLabel}>CGPA</div>
                    <div className={styles.honoursLabel} style={{ color: "#a78bfa" }}>
                      Pass
                    </div>
                  </div>
                </div>
              )}

              {/* ── Stats Grid ── */}
              <div className={styles.statsGrid}>
                {[
                  { label: "YEARS", value: totalYears, icon: "calendar_today" },
                  { label: "SEMESTERS", value: semesters.length, icon: "date_range" },
                  { label: "COURSES", value: totalCourses, icon: "book" },
                  { label: "TOTAL UNITS", value: totalUnitsAll, icon: "straighten" },
                ].map(({ label, value, icon }) => (
                  <div key={label} className={styles.statCard}>
                    <span className={`material-icons ${styles.statIcon}`}>{icon}</span>
                    <div className={styles.statValue}>{value}</div>
                    <div className={styles.statLabel}>{label}</div>
                  </div>
                ))}
              </div>

              {/* ── Per-Semester Breakdown ── */}
              <div className={styles.semesterSection}>
                <h3 className={styles.sectionTitle}>SEMESTER BREAKDOWN</h3>

                {Object.entries(byYear).map(([year, yearSems]) => (
                  <div key={year} className={styles.yearGroup}>
                    <div className={styles.yearChip}>
                      <span className="material-icons" style={{ fontSize: "0.75rem" }}>school</span>
                      YEAR {year}
                    </div>

                    <div className={styles.semCards}>
                      {yearSems.map((sem) => {
                        const gpaVal =
                          sem.gpa !== null && sem.gpa !== "error"
                            ? sem.gpa
                            : sem.computedGpa;
                        const semUnits = sem.courses.reduce(
                          (u, c) => u + (parseFloat(c.unit) || 0),
                          0
                        );
                        const gpaColor = gpaVal !== null ? getGpaColor(gpaVal) : "var(--textColor)";

                        return (
                          <div key={sem.id} className={styles.semCard}>
                            {/* Left: name + meta */}
                            <div className={styles.semLeft}>
                              <div className={styles.semName}>
                                {SEMESTER_NAMES[sem.semesterNum]} Semester
                              </div>
                              <div className={styles.semMeta}>
                                <span className={styles.semMetaItem}>
                                  <span className="material-icons" style={{ fontSize: "0.75rem" }}>book</span>
                                  {sem.courses.length} courses
                                </span>
                                <span className={styles.semMetaItem}>
                                  <span className="material-icons" style={{ fontSize: "0.75rem" }}>straighten</span>
                                  {semUnits} units
                                </span>
                              </div>
                              {gpaVal !== null && (
                                <GpaBar gpa={gpaVal} />
                              )}
                            </div>

                            {/* Right: GPA */}
                            <div
                              className={styles.semGpa}
                              style={{
                                color: gpaColor,
                                opacity: gpaVal !== null ? 1 : 0.3,
                              }}
                            >
                              {gpaVal !== null ? gpaVal.toFixed(2) : "—"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Footer note ── */}
              <div className={styles.footer}>
                Nigerian 5-point grading scale · A=5 · B=4 · C=3 · D=2 · E=1 · F=0
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
}

export default Summary;
