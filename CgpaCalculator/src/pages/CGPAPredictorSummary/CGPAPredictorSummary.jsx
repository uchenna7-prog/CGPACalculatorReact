import { useNavigate } from "react-router-dom";
import SideBar from "../../components/SideBar/SideBar";
import Header from "../../components/Header/Header";
import styles from "./CGPAPredictorSummary.module.css";
import { usePrediction } from "../../contexts/PredictionContext";
import { useSettings } from "../../contexts/SettingsContext";

function getHonours(cgpa, scale) {
  if (cgpa === null) return null;
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

function CgpaTrajectoryChart({ dataPoints, gradingScale }) {
  const maxVal = gradingScale === "4point" ? 4 : 5;
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

  const thresholds = gradingScale === "4point" 
    ? [
        { label: "1st", value: 3.5, color: "#fbbf2455" },
        { label: "2:1", value: 3.0, color: "#34d39955" },
        { label: "2:2", value: 2.0, color: "#60a5fa55" },
      ]
    : [
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

function CGPAPredictorSummary() {
  const navigate = useNavigate();
  const { currentCgpa, totalUnits, semesters, predictedCgpa } = usePrediction();
  const { gradingScale, gradePoints, GRADE_SCALES, decimalPlaces } = useSettings();

  const hasData = predictedCgpa !== null && predictedCgpa !== 0;
  const currentVal = parseFloat(currentCgpa);
  const currentHonours = getHonours(isNaN(currentVal) ? null : currentVal, gradingScale);
  const predictedHonours = getHonours(predictedCgpa, gradingScale);
  const diff = hasData && !isNaN(currentVal) ? predictedCgpa - currentVal : null;
  const predictedColor = predictedCgpa !== null ? getGpaColor(predictedCgpa, gradingScale) : "var(--accentGreen)";

  const semSummaries = semesters.map((s) => {
    const valid = s.courses.length > 0 && s.courses.every((c) => c.unit !== "" && !isNaN(parseFloat(c.unit)));
    if (!valid) return { ...s, computedGpa: null };
    const tu = s.courses.reduce((sum, c) => sum + parseFloat(c.unit), 0);
    const tp = s.courses.reduce((sum, c) => sum + parseFloat(c.unit) * gradePoints(c.grade), 0);
    return { ...s, computedGpa: tu === 0 ? null : tp / tu };
  });

  const futureCourses = semesters.reduce((sum, s) => sum + s.courses.length, 0);
  const futureUnits = semesters.reduce((sum, s) => sum + s.courses.reduce((u, c) => u + (parseFloat(c.unit) || 0), 0), 0);

  const chartPoints = (() => {
    if (!hasData || isNaN(currentVal)) return [];
    const points = [{ label: "Now", value: currentVal, color: getGpaColor(currentVal, gradingScale) }];
    let cumPts = currentVal * parseFloat(totalUnits);
    let cumUnits = parseFloat(totalUnits);
    semSummaries.forEach((s, i) => {
      const gpaVal = s.computedGpa;
      const semUnits = s.courses.reduce((u, c) => u + (parseFloat(c.unit) || 0), 0);
      if (gpaVal !== null && semUnits > 0) {
        cumPts += gpaVal * semUnits;
        cumUnits += semUnits;
        const rolling = cumPts / cumUnits;
        points.push({ label: `S${i + 1}`, value: parseFloat(rolling.toFixed(3)), color: getGpaColor(rolling, gradingScale) });
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
            <span className="material-icons" style={{ fontSize: "0.9rem" }}>arrow_back</span>
            <span className={styles.btnText}>Back</span>
          </button>
        </div>

        <main className={styles.mainContent}>
          {!hasData ? (
            <div className={styles.emptyState}>
              <span className="material-icons" style={{ fontSize: "4.5rem", color: "var(--accentGreen)", opacity: 0.3 }}> pending_actions </span>
              <h2 className={styles.emptyTitle}>No Data Found</h2>
              <p className={styles.emptySub}>Please add your current CGPA, total units, and future courses in the predictor first.</p>
              <button className={styles.goBackBtn} onClick={() => navigate("/cgpaPredictor")}> Go to Predictor </button>
            </div>
          ) : (
            <>
              <div className={styles.pageTitle}>
                <span className="material-icons" style={{ fontSize: "1.3rem" }}>trending_up</span>
                <h2>Prediction Summary</h2>
              </div>

              <div className={styles.heroBanner} style={{ background: `${predictedColor}15`, borderColor: `${predictedColor}40` }} >
                <span className={styles.heroEmoji}>{predictedHonours?.emoji ?? "📈"}</span>
                <div className={styles.heroMeta}>
                  <div className={styles.heroCgpa} style={{ color: predictedColor }}> {predictedCgpa.toFixed(Number(decimalPlaces))} </div>
                  <div className={styles.heroCgpaLabel}>PREDICTED CGPA ({gradingScale === '4point' ? '4.0' : '5.0'} SCALE)</div>
                  {predictedHonours && ( <div className={styles.heroHonours} style={{ color: predictedColor }}> {predictedHonours.label} </div> )}
                </div>
              </div>

              <div className={styles.statsRow3}>
                <div className={styles.statCard}>
                  <div className={styles.statValue} style={{ color: !isNaN(currentVal) ? getGpaColor(currentVal, gradingScale) : "var(--accentGreen)" }}>
                    {!isNaN(currentVal) ? currentVal.toFixed(2) : "—"}
                  </div>
                  <div className={styles.statLabel}>CURRENT</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue} style={{ color: predictedColor }}> {predictedCgpa.toFixed(2)} </div>
                  <div className={styles.statLabel}>PREDICTED</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue} style={{ color: diff === null ? "var(--textColor)" : diff >= 0 ? "#34d399" : "#f87171" }}>
                    {diff === null ? "—" : `${diff >= 0 ? "+" : ""}${diff.toFixed(2)}`}
                  </div>
                  <div className={styles.statLabel}>CHANGE</div>
                </div>
              </div>

              {chartPoints.length >= 2 && (
                <div className={styles.chartSection}>
                  <div className={styles.sectionTitle}>CGPA TRAJECTORY</div>
                  <div className={styles.chartWrap}>
                    <CgpaTrajectoryChart dataPoints={chartPoints} gradingScale={gradingScale} />
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
                    const gpaVal = sem.computedGpa;
                    const semUnits = sem.courses.reduce((u, c) => u + (parseFloat(c.unit) || 0), 0);
                    const gpaCol = gpaVal !== null ? getGpaColor(gpaVal, gradingScale) : "var(--textColor)";
                    const max = gradingScale === "4point" ? 4 : 5;
                    const pct = gpaVal !== null ? (gpaVal / max) * 100 : 0;
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
                <div>{gradingScale === '4point' ? '4.0 Grading Scale' : 'Nigerian 5-point grading scale'}</div>
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

export default CGPAPredictorSummary;
