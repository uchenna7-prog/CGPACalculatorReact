import { useNavigate } from "react-router-dom";
import SideBar from "../../components/SideBar/SideBar";
import Header from "../../components/Header/Header";
import styles from "./Summary.module.css";
import { useGpa } from "../../contexts/GpaContext";
import { useSettings } from "../../contexts/SettingsContext";

const SEMESTER_NAMES = { 1: "First", 2: "Second" };

// Dynamic Honours calculation based on Scale
function getHonours(cgpa, scale) {
  if (cgpa === null) return null;
  
  // Thresholds for 4.0 scale vs 5.0 scale
  const is4Point = scale === "4point";
  const thresholds = is4Point 
    ? { first: 3.5, upper: 3.0, lower: 2.0, third: 1.0 } 
    : { first: 4.5, upper: 3.5, lower: 2.4, third: 1.5 };

  if (cgpa >= thresholds.first) return { label: "First Class Honours", color: "#fbbf24", emoji: "🥇" };
  if (cgpa >= thresholds.upper) return { label: "Second Class Upper (2:1)", color: "#34d399", emoji: "🥈" };
  if (cgpa >= thresholds.lower) return { label: "Second Class Lower (2:2)", color: "#60a5fa", emoji: "🥉" };
  if (cgpa >= thresholds.third) return { label: "Third Class Honours", color: "#f87171", emoji: "📋" };
  return { label: "Pass", color: "#a78bfa", emoji: "📄" };
}

function getGpaColor(gpa, scale) {
  const is4Point = scale === "4point";
  const thresholds = is4Point 
    ? { first: 3.5, upper: 3.0, lower: 2.0, third: 1.0 } 
    : { first: 4.5, upper: 3.5, lower: 2.4, third: 1.5 };

  if (gpa >= thresholds.first) return "#fbbf24";
  if (gpa >= thresholds.upper) return "#34d399";
  if (gpa >= thresholds.lower) return "#60a5fa";
  if (gpa >= thresholds.third) return "#f87171";
  return "#a78bfa";
}

function Summary() {
  const navigate = useNavigate();
  const { semesters, cgpa } = useGpa();
  
  // Pull dynamic settings
  const { gradingScale, GRADE_SCALES, gradePoints, decimalPlaces } = useSettings();
  
  const dp = Number(decimalPlaces);
  const maxPoints = gradingScale === "4point" ? 4 : 5;
  const honours = getHonours(cgpa, gradingScale);

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
      (sum, c) => sum + parseFloat(c.unit) * gradePoints(c.grade),
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
    (sum, s) => sum + s.courses.reduce((u, c) => u + (parseFloat(c.unit) || 0), 0),
    0
  );
  const totalYears = Object.keys(byYear).length;

  return (
    <div className={styles.pageContainer}>
      <SideBar />

      <div className={styles.mainWrapper}>
        <Header title="Academic Summary" />

        <div className={styles.backBar}>
          <button className={styles.backBtn} onClick={() => navigate("/")}>
            <span className="material-icons" style={{ fontSize: "0.9rem" }}>arrow_back</span>
            <span className={styles.btnText}>Back</span>
          </button>

          <div className={styles.actionGroup}>
            <button className={styles.actionBtn}>
              <span className="material-icons" style={{ fontSize: "0.9rem" }}>share</span>
              <span className={styles.btnText}>Share</span>
            </button>
            <button className={`${styles.actionBtn} ${styles.exportBtn}`}>
              <span className="material-icons" style={{ fontSize: "0.9rem" }}>file_download</span>
              <span className={styles.btnText}>Export</span>
            </button>
          </div>
        </div>

        <main className={styles.mainContent}>
          <div className={styles.pageTitle}>
            <span className="material-icons" style={{ fontSize: "1.3rem" }}>insights</span>
            <h2>Academic Summary</h2>
          </div>

          {!hasData ? (
            <div className={styles.emptyState}>
              <span className="material-icons" style={{ fontSize: "4rem", color: "var(--accentGreen)", opacity: 0.4 }}>
                pending_actions
              </span>
              <h2 className={styles.emptyTitle}>Nothing to show yet</h2>
              <p className={styles.emptySub}>
                Go to the calculator and add courses to calculate your GPA and
                CGPA. Your full academic summary will appear here.
              </p>
              <button className={styles.goBackBtn} onClick={() => navigate("/")}>
                Go to Calculator
              </button>
            </div>
          ) : (
            <>
              {/* Honours Banner */}
              <div
                className={styles.honoursBanner}
                style={{
                  background: honours ? `${honours.color}15` : "#a78bfa15",
                  borderColor: honours ? `${honours.color}40` : "#a78bfa40",
                }}
              >
                <span className={styles.honoursEmoji}>{honours?.emoji || "📄"}</span>
                <div className={styles.honoursMeta}>
                  <div className={styles.cgpaNumber} style={{ color: "var(--accentGreen)" }}>
                    {cgpa?.toFixed(dp) || "0.00"}
                  </div>
                  <div className={styles.cgpaLabel}>CGPA ({maxPoints}.0 Scale)</div>
                  <div className={styles.honoursLabel} style={{ color: honours?.color || "#a78bfa" }}>
                    {honours?.label || "Pass"}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
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

              {/* Semester Breakdown */}
              <div className={styles.semesterSection}>
                <h3 className={styles.sectionTitle}>SEMESTER BREAKDOWN</h3>

                {Object.entries(byYear).map(([year, yearSems]) => (
                  <div key={year} className={styles.yearGroup}>
                    <div className={styles.yearChip}>YEAR {year}</div>
                    <div className={styles.semCards}>
                      {yearSems.map((sem) => {
                        const gpaVal = sem.gpa !== null && sem.gpa !== "error" ? sem.gpa : sem.computedGpa;
                        const semUnits = sem.courses.reduce((u, c) => u + (parseFloat(c.unit) || 0), 0);
                        const gpaColor = gpaVal !== null ? getGpaColor(gpaVal, gradingScale) : "var(--textColor)";
                        // Fill percentage based on current scale (4 or 5)
                        const pct = gpaVal !== null ? (gpaVal / maxPoints) * 100 : 0;

                        return (
                          <div key={sem.id} className={styles.semCard}>
                            <div className={styles.semLeft}>
                              <div className={styles.semName}>
                                {SEMESTER_NAMES[sem.semesterNum]} Semester
                              </div>
                              <div className={styles.semMeta}>
                                <span>{sem.courses.length} courses</span>
                                <span>{semUnits} units</span>
                              </div>
                            </div>
                            <div className={styles.semRight}>
                              <div className={styles.semGpa} style={{ color: gpaColor, opacity: gpaVal !== null ? 1 : 0.3 }}>
                                {gpaVal !== null ? gpaVal.toFixed(dp) : "—"}
                              </div>
                              {gpaVal !== null && (
                                <div className={styles.gpaBarTrack}>
                                  <div className={styles.gpaBarFill} style={{ width: `${pct}%`, background: gpaColor }} />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.footer}>
                <div>{gradingScale === "4point" ? "4.0 Grading Scale" : "Nigerian 5-point grading scale"}</div>
                <div>
                  {GRADE_SCALES[gradingScale]
                    .map((row) => `${row.grade}=${row.points}`)
                    .join(" · ")}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Summary;
