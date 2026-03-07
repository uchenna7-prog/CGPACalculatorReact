import { useNavigate } from "react-router-dom";
import SideBar from "../../components/SideBar/SideBar";
import Header from "../../components/Header/Header";
import styles from "./GpaCalculatorSummary.module.css";
import { useGpaCalculator } from "../../contexts/GpaCalculatorContext";
import { useSettings } from "../../contexts/SettingsContext";

// Dynamic Honours calculation based on Scale
function getHonours(gpa, scale) {
  if (gpa === null) return null;
  const is4Point = scale === "4point";
  const thresholds = is4Point 
    ? { first: 3.5, upper: 3.0, lower: 2.0, third: 1.0 } 
    : { first: 4.5, upper: 3.5, lower: 2.4, third: 1.5 };

  if (gpa >= thresholds.first) return { label: "First Class Honours", color: "#fbbf24", emoji: "🥇" };
  if (gpa >= thresholds.upper) return { label: "Second Class Upper (2:1)", color: "#34d399", emoji: "🥈" };
  if (gpa >= thresholds.lower) return { label: "Second Class Lower (2:2)", color: "#60a5fa", emoji: "🥉" };
  if (gpa >= thresholds.third) return { label: "Third Class Honours", color: "#f87171", emoji: "📋" };
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

function GpaBarChart({ gradeBreakdown, totalCourses, gradingScale }) {
  const maxCount = Math.max(...gradeBreakdown.map((g) => g.count), 1);
  const chartH = 100;
  const chartW = 300;
  const padL = 20;
  const padB = 28;
  const padT = 18;
  const padR = 10;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const barW = Math.min(32, (innerW / gradeBreakdown.length) * 0.6);
  const gap = innerW / gradeBreakdown.length;

  return (
    <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {gradeBreakdown.map((g, i) => {
        const barH = (g.count / maxCount) * innerH;
        const x = padL + i * gap + gap / 2 - barW / 2;
        const y = padT + innerH - barH;
        const col = getGpaColor(g.points, gradingScale);
        const pct = Math.round((g.count / totalCourses) * 100);
        return (
          <g key={g.grade}>
            <rect x={x} y={y} width={barW} height={barH} fill={col} opacity={0.85} rx={3} />
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" style={{ fontSize: 8, fill: col, fontFamily: "Consolas, monospace", fontWeight: "bold" }}> {g.count} </text>
            {barH > 18 && (
              <text x={x + barW / 2} y={y + barH - 5} textAnchor="middle" style={{ fontSize: 7, fill: "#fff", fontFamily: "Consolas, monospace", opacity: 0.8 }}> {pct}% </text>
            )}
            <text x={x + barW / 2} y={padT + innerH + 14} textAnchor="middle" style={{ fontSize: 9, fill: col, fontFamily: "Consolas, monospace", fontWeight: "bold" }}> {g.grade} </text>
            <text x={x + barW / 2} y={padT + innerH + 24} textAnchor="middle" style={{ fontSize: 7, fill: "var(--textColor)", opacity: 0.4, fontFamily: "Consolas, monospace" }}> {g.points}pt </text>
          </g>
        );
      })}
      <line x1={padL} y1={padT + innerH} x2={chartW - padR} y2={padT + innerH} stroke="var(--borderColor)" strokeWidth="1" />
    </svg>
  );
}

function GpaCalculatorSummary() {
  const navigate = useNavigate();
  const { courses } = useGpaCalculator();
  const { gradingScale, gradePoints, availableGrades, decimalPlaces, GRADE_SCALES } = useSettings();

  const dp = Number(decimalPlaces);
  const maxPoints = gradingScale === "4point" ? 4 : 5;

  // AUTO-CALCULATION LOGIC
  const totalUnits = courses.reduce((sum, c) => sum + (parseFloat(c.unit) || 0), 0);
  const totalPoints = courses.reduce((sum, c) => sum + (parseFloat(c.unit) || 0) * gradePoints(c.grade), 0);
  const autoGpa = totalUnits > 0 ? totalPoints / totalUnits : null;

  const hasData = courses.length > 0 && totalUnits > 0;
  const honours = getHonours(autoGpa, gradingScale);
  const gpaColor = autoGpa !== null ? getGpaColor(autoGpa, gradingScale) : "var(--accentGreen)";

  const gradeBreakdown = availableGrades.map((g) => ({
    grade: g,
    count: courses.filter((c) => c.grade === g).length,
    points: gradePoints(g),
  })).filter((g) => g.count > 0);

  const gradeUnits = gradeBreakdown.map((g) => ({
    ...g,
    units: courses.filter((c) => c.grade === g.grade).reduce((sum, c) => sum + (parseFloat(c.unit) || 0), 0),
  }));

  const highestGrade = gradeBreakdown[0]?.grade ?? "—";
  const lowestGrade = gradeBreakdown[gradeBreakdown.length - 1]?.grade ?? "—";

  return (
    <div className={styles.pageContainer}>
      <SideBar />
      <div className={styles.mainWrapper}>
        <Header title="Summary" />

        <div className={styles.backBar}>
          <button className={styles.backBtn} onClick={() => navigate("/gpaCalculator")}>
            <span className="material-icons" style={{ fontSize: "0.9rem" }}>arrow_back</span>
            <span className={styles.btnText}>Back</span>
          </button>

          <div className={styles.actionGroup}>
            <button className={`${styles.actionBtn} ${styles.exportBtn}`}>
              <span className="material-icons" style={{ fontSize: "0.9rem" }}>file_download</span>
              <span className={styles.btnText}>Export</span>
            </button>
          </div>
        </div>

        <main className={styles.mainContent}>
          {!hasData ? (
            <div className={styles.emptyState}>
              <span className="material-icons" style={{ fontSize: "4rem", color: "var(--accentGreen)", opacity: 0.35 }}> pending_actions </span>
              <h3 className={styles.emptyTitle}>Nothing to show yet</h3>
              <p className={styles.emptySub}>Add courses with units in the calculator to see your results.</p>
              <button className={styles.goBackBtn} onClick={() => navigate("/gpaCalculator")}> Go to Calculator </button>
            </div>
          ) : (
            <>
              {/* Centered Hero Banner */}
              <div className={styles.heroBanner} style={{ background: `${gpaColor}15`, borderColor: `${gpaColor}40` }} >
                <span className={styles.heroEmoji}>{honours?.emoji ?? "📊"}</span>
                <div className={styles.heroMeta}>
                  <div className={styles.heroGpa} style={{ color: gpaColor }}> {autoGpa?.toFixed(dp) || "0.00"} </div>
                  <div className={styles.heroGpaLabel}>OVERALL GPA ({maxPoints}.0 SCALE)</div>
                  {honours && ( <div className={styles.heroClassLabel} style={{ color: gpaColor }}> {honours.label} </div> )}
                </div>
              </div>

              <div className={styles.statsGrid}>
                {[
                  { label: "COURSES", value: courses.length, icon: "book" },
                  { label: "TOTAL UNITS", value: totalUnits, icon: "straighten" },
                  { label: "HIGHEST", value: highestGrade, icon: "trending_up" },
                  { label: "LOWEST", value: lowestGrade, icon: "trending_down" },
                ].map(({ label, value, icon }) => (
                  <div key={label} className={styles.statCard}>
                    <span className={`material-icons ${styles.statIcon}`}>{icon}</span>
                    <div className={styles.statValue}>{value}</div>
                    <div className={styles.statLabel}>{label}</div>
                  </div>
                ))}
              </div>

              <div className={styles.chartSection}>
                <div className={styles.sectionTitle}>GRADE DISTRIBUTION</div>
                <div className={styles.chartWrap}>
                  <GpaBarChart gradeBreakdown={gradeBreakdown} totalCourses={courses.length} gradingScale={gradingScale} />
                </div>
              </div>

              <div className={styles.breakdownSection}>
                <div className={styles.sectionTitle}>GRADE BREAKDOWN</div>
                <div className={styles.breakdownList}>
                  {gradeBreakdown.map(({ grade, count, points }) => {
                    const pct = Math.round((count / courses.length) * 100);
                    const gradeCol = getGpaColor(points, gradingScale);
                    const unitSum = gradeUnits.find((g) => g.grade === grade)?.units ?? 0;
                    return (
                      <div key={grade} className={styles.breakdownRow}>
                        <div className={styles.gradeBadge} style={{ background: `${gradeCol}20`, border: `1px solid ${gradeCol}50`, color: gradeCol }} > {grade} </div>
                        <div className={styles.breakdownMeta}>
                          <div className={styles.breakdownTop}>
                            <span className={styles.breakdownInfo}> {count} course{count !== 1 ? "s" : ""} · {unitSum} units </span>
                            <span className={styles.breakdownPct} style={{ color: gradeCol }}>{pct}%</span>
                          </div>
                          <div className={styles.barTrack}>
                            <div className={styles.barFill} style={{ width: `${pct}%`, background: gradeCol }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={styles.courseSection}>
                <div className={styles.sectionTitle}>ALL COURSES</div>
                <div className={styles.courseList}>
                  {courses.map((course, idx) => {
                    const col = getGpaColor(gradePoints(course.grade), gradingScale);
                    return (
                      <div key={course.id} className={styles.courseRow}>
                        <div className={styles.courseIndex}>{idx + 1}</div>
                        <div className={styles.courseCode}> {course.code || <span style={{ opacity: 0.3 }}>—</span>} </div>
                        <div className={styles.courseUnit}>{course.unit} unit{parseFloat(course.unit) !== 1 ? "s" : ""}</div>
                        <div className={styles.courseGrade} style={{ background: `${col}20`, border: `1px solid ${col}50`, color: col }} > {course.grade} </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={styles.footer}>
                <div>{gradingScale === "4point" ? "4.0 Grading Scale" : "Nigerian 5-point grading scale"}</div>
                <div>
                  {GRADE_SCALES[gradingScale].map((row) => `${row.grade}=${row.points}`).join(" · ")}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default GpaCalculatorSummary;
