import { useNavigate } from "react-router-dom";
import SideBar from "../../components/SideBar/SideBar";
import Header from "../../components/Header/Header";
import styles from "./CGPAPredictorSummary.module.css";
import { usePrediction } from "../../contexts/PredictionContext";
import { useSettings } from "../../contexts/SettingsContext";

function getHonours(cgpa, scale) {
  if (cgpa === null || isNaN(cgpa)) return null;
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
    ? [{ label: "1st", value: 3.5, color: "#fbbf2455" }, { label: "2:1", value: 3.0, color: "#34d39955" }]
    : [{ label: "1st", value: 4.5, color: "#fbbf2455" }, { label: "2:1", value: 3.5, color: "#34d39955" }];

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
        </g>
      ))}
      {n >= 2 && (
        <>
          <polygon points={`${padL},${padT + innerH} ${pts} ${xPos(n - 1)},${padT + innerH}`} fill="url(#trajGrad)" />
          <polyline points={pts} fill="none" stroke="#4caf7d" strokeWidth="2.5" />
        </>
      )}
      {dataPoints.map((d, i) => (
        <circle key={i} cx={xPos(i)} cy={yPos(d.value)} r={4} fill={d.color} />
      ))}
    </svg>
  );
}

function CGPAPredictorSummary() {
  const navigate = useNavigate();
  const { currentCgpa, totalUnits, semesters } = usePrediction();
  const { gradingScale, gradePoints, GRADE_SCALES, decimalPlaces } = useSettings();

  // ── Auto-Calculation Logic ──
  const currentVal = parseFloat(currentCgpa);
  const totalUnitsVal = parseFloat(totalUnits);
  
  // Calculate future impact
  let futurePoints = 0;
  let futureUnitsTotal = 0;

  const semSummaries = semesters.map((s) => {
    const semUnits = s.courses.reduce((u, c) => u + (parseFloat(c.unit) || 0), 0);
    const semPoints = s.courses.reduce((p, c) => p + (parseFloat(c.unit) || 0) * gradePoints(c.grade), 0);
    
    futurePoints += semPoints;
    futureUnitsTotal += semUnits;

    return {
      ...s,
      computedGpa: semUnits > 0 ? semPoints / semUnits : null,
      semUnits
    };
  });

  // Final Predicted Value
  const totalPointsSoFar = currentVal * totalUnitsVal;
  const combinedPoints = totalPointsSoFar + futurePoints;
  const combinedUnits = totalUnitsVal + futureUnitsTotal;
  const autoPredictedCgpa = combinedUnits > 0 ? combinedPoints / combinedUnits : null;

  // Validation for "No Data Found"
  const hasData = !isNaN(currentVal) && !isNaN(totalUnitsVal) && totalUnitsVal > 0;

  const predictedHonours = getHonours(autoPredictedCgpa, gradingScale);
  const diff = hasData ? autoPredictedCgpa - currentVal : null;
  const predictedColor = autoPredictedCgpa !== null ? getGpaColor(autoPredictedCgpa, gradingScale) : "var(--accentGreen)";

  const chartPoints = (() => {
    if (!hasData) return [];
    const points = [{ label: "Now", value: currentVal, color: getGpaColor(currentVal, gradingScale) }];
    let runningPts = totalPointsSoFar;
    let runningUnits = totalUnitsVal;

    semSummaries.forEach((s, i) => {
        if (s.computedGpa !== null) {
            runningPts += (s.computedGpa * s.semUnits);
            runningUnits += s.semUnits;
            const rolling = runningPts / runningUnits;
            points.push({ label: `S${i+1}`, value: rolling, color: getGpaColor(rolling, gradingScale)});
        }
    });
    return points;
  })();

  return (
    <div className={styles.pageContainer}>
      <SideBar />
      <div className={styles.mainWrapper}>
        <Header title="Prediction Summary" />
        
        <div className={styles.backBar}>
          <button className={styles.backBtn} onClick={() => navigate("/cgpaPredictor")}>
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
          {!hasData ? (
            <div className={styles.emptyState}>
              <span className="material-icons" style={{ fontSize: "4.5rem", color: "var(--accentGreen)", opacity: 0.3 }}> pending_actions </span>
              <h2 className={styles.emptyTitle}>No Data Found</h2>
              <p className={styles.emptySub}>Add your current CGPA and Total Units in the predictor to see your summary automatically.</p>
              <button className={styles.goBackBtn} onClick={() => navigate("/cgpaPredictor")}> Enter Data </button>
            </div>
          ) : (
            <>
              <div className={styles.heroBanner} style={{ background: `${predictedColor}15`, borderColor: `${predictedColor}40` }} >
                <span className={styles.heroEmoji}>{predictedHonours?.emoji ?? "📈"}</span>
                <div className={styles.heroMeta}>
                  <div className={styles.heroCgpa} style={{ color: predictedColor }}> 
                    {autoPredictedCgpa.toFixed(Number(decimalPlaces))} 
                  </div>
                  <div className={styles.heroCgpaLabel}>PREDICTED CGPA ({gradingScale === '4point' ? '4.0' : '5.0'} SCALE)</div>
                  {predictedHonours && ( <div className={styles.heroHonours} style={{ color: predictedColor }}> {predictedHonours.label} </div> )}
                </div>
              </div>

              <div className={styles.statsRow3}>
                <div className={styles.statCard}>
                  <div className={styles.statValue} style={{ color: getGpaColor(currentVal, gradingScale) }}> {currentVal.toFixed(2)} </div>
                  <div className={styles.statLabel}>CURRENT</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue} style={{ color: predictedColor }}> {autoPredictedCgpa.toFixed(2)} </div>
                  <div className={styles.statLabel}>PREDICTED</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue} style={{ color: diff >= 0 ? "#34d399" : "#f87171" }}>
                    {diff >= 0 ? "+" : ""}{diff.toFixed(2)}
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
                <div className={styles.statCard}>
                   <span className="material-icons">straighten</span>
                   <div className={styles.statValue}>{futureUnitsTotal}</div>
                   <div className={styles.statLabel}>FUTURE UNITS</div>
                </div>
                <div className={styles.statCard}>
                   <span className="material-icons">history_edu</span>
                   <div className={styles.statValue}>{totalUnitsVal}</div>
                   <div className={styles.statLabel}>UNITS SO FAR</div>
                </div>
              </div>

              <div className={styles.footer}>
                <div>{gradingScale === '4point' ? '4.0 Grading Scale' : 'Nigerian 5-point grading scale'}</div>
                <div>{GRADE_SCALES[gradingScale].map((row) => `${row.grade}=${row.points}`).join(" · ")}</div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default CGPAPredictorSummary;
