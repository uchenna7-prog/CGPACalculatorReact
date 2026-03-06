import { useNavigate } from "react-router-dom";
import SideBar from "../../components/SideBar/SideBar";
import Header from "../../components/Header/Header";
import styles from "./CGPAPredictorSummary.module.css";
import { usePrediction } from "../../contexts/PredictionContext";

const GRADE_POINTS = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };

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

// ── SVG Trajectory Chart ───────────────────────────────────────────────────
function CgpaTrajectoryChart({ dataPoints }) {
  const maxVal = 5;
  const chartH = 130;
  const chartW = 340;
  const padL = 32;
  const padB = 28;
  const padT = 18;
  const padR = 16;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const n = dataPoints.length;

  const xPos = (i) => padL + (i / Math.max(n - 1, 1)) * innerW;
  const yPos = (v) => padT + innerH - (v / maxVal) * innerH;

  const pts = dataPoints.map((d, i) => `${xPos(i)},${yPos(d.value)}`).join(" ");

  const thresholds = [
    { label: "1st", value: 4.5, color: "#fbbf2455" },
    { label: "2:1", value: 3.5, color: "#34d39955" },
    { label: "2:2", value: 2.4, color: "#60a5fa55" },
    { label: "3rd", value: 1.5, color: "#f8717155" },
  ];

  return (
    <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="trajGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4caf7d" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#4caf7d" stopOpacity="0" />
        </linearGradient>
      </defs>

      {thresholds.map((t) => (
        <g key={t.label}>
          <line x1={padL} y1={yPos(t.value)} x2={chartW - padR} y2={yPos(t.value)} stroke={t.color} strokeWidth="1" strokeDasharray="4 3" />
          <text x={padL - 4} y={yPos(t.value) + 3.5} textAnchor="end" style={{ fontSize: 8, fill: t.color.replace("55", "bb"), fontFamily: "Consolas, monospace" }}> {t.label} </text>
        </g>
      ))}
      <line x1={padL} y1={padT + innerH} x2={chartW - padR} y2={padT + innerH} stroke="var(--borderColor)" strokeWidth="1" />
      {n >= 2 && (
        <>
          <polygon points={`${padL},${padT + innerH} ${pts} ${xPos(n - 1)},${padT + innerH}`} fill="url(#trajGrad)" />
          <polyline points={pts} fill="none" stroke="#4caf7d" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        </>
      )}
      {dataPoints.map((d, i) => (
        <g key={i}>
          <circle cx={xPos(i)} cy={yPos(d.value)} r={5} fill={d.color} stroke="var(--bg)" strokeWidth="2" />
          <text x={xPos(i)} y={yPos(d.value) - 9} textAnchor="middle" style={{ fontSize: 8.5, fill: d.color, fontFamily: "Consolas, monospace", fontWeight: "bold" }}> {d.value.toFixed(2)} </text>
          <text x={xPos(i)} y={padT + innerH + 16} textAnchor="middle" style={{ fontSize: 8, fill: "var(--textColor)", opacity: 0.5, fontFamily: "Consolas, monospace" }}> {d.label} </text>
        </g>
      ))}
    </svg>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
function CGPAPredictorSummary() {
  const navigate = useNavigate();
  const { currentCgpa, totalUnits, semesters, predictedCgpa } = usePrediction();

  const hasData = predictedCgpa !== null;
  const currentVal = parseFloat(currentCgpa);
  const currentHonours = getHonours(isNaN(currentVal) ? null : currentVal);
  const predictedHonours = getHonours(predictedCgpa);
  const diff = hasData && !isNaN(currentVal) ? predictedCgpa - currentVal : null;
  const predictedColor = predictedCgpa !== null ? getGpaColor(predictedCgpa) : "var(--accentGreen)";

  const semSummaries = semesters.map((s) => {
    const valid = s.courses.length > 0 && s.courses.every((c) => c.unit !== "" && !isNaN(parseFloat(c.unit)));
    if (!valid) return { ...s, computedGpa: null };
    const tu = s.courses.reduce((sum, c) => sum + parseFloat(c.unit), 0);
    const tp = s.courses.reduce((sum, c) => sum + parseFloat(c.unit) * GRADE_POINTS[c.grade], 0);
    return { ...s, computedGpa: tu === 0 ? null : tp / tu };
  });

  const futureCourses = semesters.reduce((sum, s) => sum + s.courses.length, 0);
  const futureUnits = semesters.reduce((sum, s) => sum + s.courses.reduce((u, c) => u + (parseFloat(c.unit) || 0), 0), 0);

  const chartPoints = (() => {
    if (!hasData || isNaN(currentVal)) return [];
    const points = [{ label: "Now", value: currentVal, color: getGpaColor(currentVal) }];
    let cumPts = currentVal * parseFloat(totalUnits);
    let cumUnits = parseFloat(totalUnits);
    semSummaries.forEach((s, i) => {
      const gpaVal = s.gpa !== null && s.gpa !== "error" ? s.gpa : s.computedGpa;
      const semUnits = s.courses.reduce((u, c) => u + (parseFloat(c.unit) || 0), 0);
      if (gpaVal !== null && semUnits > 0) {
        cumPts += gpaVal * semUnits;
        cumUnits += semUnits;
        const rolling = cumPts / cumUnits;
        points.push({ label: `S${i + 1}`, value: parseFloat(rolling.toFixed(3)), color: getGpaColor(rolling) });
      }
    });
    return points;
  })();

  return (
    <div className={styles.pageContainer}>
      <SideBar />
      <div className={styles.mainWrapper}>
        <Header title="Summary" />
        <div className={styles.backBar}>
          <button className={styles.backBtn} onClick={() => navigate("/cgpaPredictor")}>
            <span className="material-icons" style={{ fontSize: "1rem" }}>arrow_back</span>
            <span>Back</span>
          </button>
          
          <div className={styles.actionGroup}>
            <button className={styles.actionBtn}>
              <span className="material-icons" style={{ fontSize: "1rem" }}>share</span>
              <span>Share</span>
            </button>
            <button className={`${styles.actionBtn} ${styles.exportBtn}`}>
              <span className="material-icons" style={{ fontSize: "1rem" }}>file_download</span>
              <span>Export</span>
            </button>
          </div>
        </div>

        <main className={styles.mainContent}>
          <div className={styles.pageTitle}>
            <span className="material-icons" style={{ fontSize: "1.3rem" }}>trending_up</span>
            <h2>Prediction Summary</h2>
          </div>

          {!hasData ? (
            <div className={styles.emptyState}>
              <span className="material-icons" style={{ fontSize: "4rem", color: "var(--accentGreen)", opacity: 0.4 }}> pending_actions </span>
              <h3 className={styles.emptyTitle}>No prediction yet</h3>
              <p className={styles.emptySub}> Go to the CGPA Predictor, fill in your current CGPA, total units, add your future courses and hit Predict CGPA — then come back here. </p>
              <button className={styles.goBackBtn} onClick={() => navigate("/cgpaPredictor")}> Go to Predictor </button>
            </div>
          ) : (
            <>
              <div className={styles.heroBanner} style={{ background: `${predictedColor}15`, borderColor: `${predictedColor}40` }} >
                <span className={styles.heroEmoji}>{predictedHonours?.emoji ?? "📈"}</span>
                <div className={styles.heroMeta}>
                  <div className={styles.heroCgpa} style={{ color: predictedColor }}> {predictedCgpa.toFixed(2)} </div>
                  <div className={styles.heroCgpaLabel}>PREDICTED CGPA</div>
                  {predictedHonours && ( <div className={styles.heroHonours} style={{ color: predictedColor }}> {predictedHonours.label} </div> )}
                </div>
              </div>

              <div className={styles.statsRow3}>
                <div className={styles.statCard}>
                  <div className={styles.statValue} style={{ color: !isNaN(currentVal) ? getGpaColor(currentVal) : "var(--accentGreen)" }}>
                    {!isNaN(currentVal) ? currentVal.toFixed(2) : "—"}
                  </div>
                  <div className={styles.statLabel}>CURRENT</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue} style={{ color: predictedColor }}> {predictedCgpa.toFixed(2)} </div>
                  <div className={styles.statLabel}>PREDICTED</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue} style={{ color: diff === null ? "var(--textColor)" : diff >= 0 ? "#34d399" : "#f87171", }}>
                    {diff === null ? "—" : `${diff >= 0 ? "+" : ""}${diff.toFixed(2)}`}
                  </div>
                  <div className={styles.statLabel}>CHANGE</div>
                </div>
              </div>

              {currentHonours && predictedHonours && currentHonours.label !== predictedHonours.label && (
                <div className={styles.classChange} style={{ background: `${predictedColor}0d`, borderColor: `${predictedColor}30` }}>
                  <span style={{ fontFamily: "Consolas, monospace", fontSize: "0.72rem", color: getGpaColor(currentVal), fontWeight: 700 }}> {currentHonours.emoji} {currentHonours.label} </span>
                  <span className="material-icons" style={{ fontSize: "1rem", color: "var(--accentGreen)", opacity: 0.7 }}> arrow_forward </span>
                  <span style={{ fontFamily: "Consolas, monospace", fontSize: "0.72rem", color: predictedColor, fontWeight: 700 }}> {predictedHonours.emoji} {predictedHonours.label} </span>
                </div>
              )}

              {chartPoints.length >= 2 && (
                <div className={styles.chartSection}>
                  <div className={styles.sectionTitle}>CGPA TRAJECTORY</div>
                  <div className={styles.chartWrap}>
                    <CgpaTrajectoryChart dataPoints={chartPoints} />
                  </div>
                </div>
              )}

              <div className={styles.statsGrid}>
                {[
                  { label: "FUTURE SEMESTERS", value: semesters.length, icon: "date_range" },
                  { label: "FUTURE COURSES", value: futureCourses, icon: "book" },
                  { label: "FUTURE UNITS", value: futureUnits, icon: "straighten" },
                  { label: "UNITS SO FAR", value: totalUnits || "—", icon: "history_edu" },
                ].map(({ label, value, icon }) => (
                  <div key={label} className={styles.statCard}>
                    <span className={`material-icons ${styles.statIcon}`}>{icon}</span>
                    <div className={styles.statValue}>{value}</div>
                    <div className={styles.statLabel}>{label}</div>
                  </div>
                ))}
              </div>

              <div className={styles.semesterSection}>
                <div className={styles.sectionTitle}>SEMESTER BREAKDOWN</div>
                <div className={styles.semCards}>
                  {semSummaries.map((sem) => {
                    const gpaVal = sem.gpa !== null && sem.gpa !== "error" ? sem.gpa : sem.computedGpa;
                    const semUnits = sem.courses.reduce((u, c) => u + (parseFloat(c.unit) || 0), 0);
                    const gpaCol = gpaVal !== null ? getGpaColor(gpaVal) : "var(--textColor)";
                    const pct = gpaVal !== null ? (gpaVal / 5) * 100 : 0;
                    return (
                      <div key={sem.id} className={styles.semCard}>
                        <div className={styles.semLeft}>
                          <div className={styles.semName}>Semester {sem.num}</div>
                          <div className={styles.semMeta}>
                            <span>{sem.courses.length} courses</span>
                            <span>{semUnits} units</span>
                          </div>
                        </div>
                        <div className={styles.semRight}>
                          <div className={styles.semGpa} style={{ color: gpaCol, opacity: gpaVal !== null ? 1 : 0.3 }}>
                            {gpaVal !== null ? gpaVal.toFixed(2) : "—"}
                          </div>
                          {gpaVal !== null && (
                            <div className={styles.gpaBarTrack}>
                              <div className={styles.gpaBarFill} style={{ width: `${pct}%`, background: gpaCol }} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={styles.footer}>
                <div>Nigerian 5-point grading scale</div>
                <div>A=5 · B=4 · C=3 · D=2 · E=1 · F=0</div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default CGPAPredictorSummary;
