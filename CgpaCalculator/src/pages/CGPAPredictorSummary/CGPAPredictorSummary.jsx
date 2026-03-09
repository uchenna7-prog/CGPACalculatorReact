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

  const currentVal = parseFloat(currentCgpa);
  const totalUnitsVal = parseFloat(totalUnits);

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

  const totalPointsSoFar = currentVal * totalUnitsVal;
  const combinedPoints = totalPointsSoFar + futurePoints;
  const combinedUnits = totalUnitsVal + futureUnitsTotal;
  const autoPredictedCgpa = combinedUnits > 0 ? combinedPoints / combinedUnits : null;

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
        runningPts += s.computedGpa * s.semUnits;
        runningUnits += s.semUnits;
        const rolling = runningPts / runningUnits;
        points.push({ label: `S${i + 1}`, value: rolling, color: getGpaColor(rolling, gradingScale) });
      }
    });
    return points;
  })();

  async function handleExport() {
    if (!window.jspdf) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 48;
    const contentW = pageW - margin * 2;
    let y = margin;

    const checkPage = (needed = 20) => {
      if (y + needed > pageH - margin) { doc.addPage(); y = margin; }
    };

    const hex2rgb = (hex) => {
      const h = hex.replace("#", "");
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    };

    const dp = Number(decimalPlaces);
    const maxScale = gradingScale === "4point" ? 4 : 5;
    const resolvedPredColor = autoPredictedCgpa !== null ? getGpaColor(autoPredictedCgpa, gradingScale) : "#34d399";
    const resolvedCurColor = getGpaColor(currentVal, gradingScale);
    const hColour = predictedHonours?.color || "#a78bfa";
    const [hr, hg, hb] = hex2rgb(hColour);
    const [pr, pg, pb] = hex2rgb(resolvedPredColor);

    doc.setFillColor(18, 18, 18);
    doc.rect(0, 0, pageW, 90, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("CGPA Prediction Report", margin, 38);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 160, 160);
    doc.text(`Generated on ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, margin, 56);
    doc.text(`Grading Scale: ${gradingScale === "4point" ? "4.0 GPA" : "5.0 GPA (Nigerian)"}`, margin, 70);

    y = 110;

    doc.setFillColor(pr, pg, pb, 0.1);
    doc.setDrawColor(pr, pg, pb);
    doc.setLineWidth(1);
    doc.roundedRect(margin, y, contentW, 62, 6, 6, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);
    doc.setTextColor(pr, pg, pb);
    doc.text(autoPredictedCgpa?.toFixed(dp) ?? "—", margin + 16, y + 38);
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text(`PREDICTED CGPA  (${maxScale}.0 SCALE)`, margin + 16, y + 52);

    if (predictedHonours) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(hr, hg, hb);
      doc.text(predictedHonours.label, pageW - margin - 16, y + 38, { align: "right" });
    }

    y += 80;

    const card3W = (contentW - 8) / 3;
    const cards3 = [
      { label: "CURRENT CGPA", value: currentVal.toFixed(dp), color: resolvedCurColor },
      { label: "PREDICTED CGPA", value: autoPredictedCgpa?.toFixed(dp) ?? "—", color: resolvedPredColor },
      { label: "CHANGE", value: `${diff >= 0 ? "+" : ""}${diff?.toFixed(dp) ?? "—"}`, color: diff >= 0 ? "#34d399" : "#f87171" },
    ];

    cards3.forEach((card, i) => {
      const x = margin + i * (card3W + 4);
      const [cr, cg, cb] = hex2rgb(card.color);
      doc.setFillColor(28, 28, 28);
      doc.setDrawColor(50, 50, 50);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, card3W, 52, 4, 4, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(cr, cg, cb);
      doc.text(card.value, x + card3W / 2, y + 28, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(130, 130, 130);
      doc.text(card.label, x + card3W / 2, y + 43, { align: "center" });
    });

    y += 68;

    if (chartPoints.length >= 2) {
      checkPage(140);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(130, 130, 130);
      doc.text("CGPA TRAJECTORY", margin, y);
      y += 4;
      doc.setDrawColor(50, 50, 50);
      doc.setLineWidth(0.5);
      doc.line(margin, y, margin + contentW, y);
      y += 12;

      const chartAreaH = 90;
      const innerH = chartAreaH - 24;
      const n = chartPoints.length;
      const xPos = (i) => margin + (i / Math.max(n - 1, 1)) * contentW;
      const yPos = (v) => y + innerH - (v / maxScale) * innerH;

      const threshLines = gradingScale === "4point"
        ? [{ val: 3.5, color: "#fbbf24" }, { val: 3.0, color: "#34d399" }]
        : [{ val: 4.5, color: "#fbbf24" }, { val: 3.5, color: "#34d399" }];

      threshLines.forEach(({ val, color }) => {
        const [tr, tg, tb] = hex2rgb(color);
        doc.setDrawColor(tr, tg, tb, 0.4);
        doc.setLineWidth(0.6);
        doc.setLineDashPattern([4, 3], 0);
        doc.line(margin, yPos(val), margin + contentW, yPos(val));
      });
      doc.setLineDashPattern([], 0);

      doc.setDrawColor(76, 175, 125);
      doc.setLineWidth(2);
      for (let i = 0; i < n - 1; i++) {
        doc.line(xPos(i), yPos(chartPoints[i].value), xPos(i + 1), yPos(chartPoints[i + 1].value));
      }

      chartPoints.forEach((pt, i) => {
        const [cr, cg, cb] = hex2rgb(pt.color);
        doc.setFillColor(cr, cg, cb);
        doc.circle(xPos(i), yPos(pt.value), 4, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(cr, cg, cb);
        doc.text(pt.value.toFixed(dp), xPos(i), yPos(pt.value) - 7, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(150, 150, 150);
        doc.text(pt.label, xPos(i), y + innerH + 14, { align: "center" });
      });

      doc.setDrawColor(50, 50, 50);
      doc.setLineWidth(0.5);
      doc.line(margin, y + innerH, margin + contentW, y + innerH);
      y += chartAreaH + 16;
    }

    checkPage(70);
    const card2W = (contentW - 8) / 2;
    const unitCards = [
      { label: "UNITS SO FAR", value: totalUnitsVal, icon: "history" },
      { label: "FUTURE UNITS", value: futureUnitsTotal, icon: "forward" },
    ];

    unitCards.forEach((card, i) => {
      const x = margin + i * (card2W + 8);
      doc.setFillColor(28, 28, 28);
      doc.setDrawColor(50, 50, 50);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, card2W, 52, 4, 4, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(52, 211, 153);
      doc.text(String(card.value), x + card2W / 2, y + 28, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      doc.text(card.label, x + card2W / 2, y + 43, { align: "center" });
    });

    y += 68;

    if (semSummaries.length > 0) {
      checkPage(50);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(130, 130, 130);
      doc.text("FUTURE SEMESTER BREAKDOWN", margin, y);
      y += 4;
      doc.setDrawColor(50, 50, 50);
      doc.setLineWidth(0.5);
      doc.line(margin, y, margin + contentW, y);
      y += 14;

      semSummaries.forEach((sem, idx) => {
        if (sem.computedGpa === null) return;
        checkPage(100);

        const semGpaColor = getGpaColor(sem.computedGpa, gradingScale);
        const [scr, scg, scb] = hex2rgb(semGpaColor);
        const pct = sem.computedGpa / maxScale;

        doc.setFillColor(24, 24, 24);
        doc.setDrawColor(45, 45, 45);
        doc.roundedRect(margin, y, contentW, 42, 4, 4, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(230, 230, 230);
        doc.text(`Semester ${idx + 1}`, margin + 12, y + 16);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(130, 130, 130);
        doc.text(`${sem.courses.length} courses  ·  ${sem.semUnits} units`, margin + 12, y + 28);

        // ── STACKED GPA & PROGRESS BAR ──
        const columnX = pageW - margin - 12; 
        const barWidth = 60;
        const barX = columnX - barWidth;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(scr, scg, scb);
        doc.text(sem.computedGpa.toFixed(dp), columnX, y + 18, { align: "right" });

        doc.setFillColor(50, 50, 50);
        doc.roundedRect(barX, y + 26, barWidth, 4, 2, 2, "F");
        doc.setFillColor(scr, scg, scb);
        doc.roundedRect(barX, y + 26, barWidth * pct, 4, 2, 2, "F");

        y += 48;

        checkPage(20);
        doc.setFillColor(35, 35, 35);
        doc.rect(margin, y, contentW, 16, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 100, 100);
        const cols = { name: margin + 8, unit: margin + contentW * 0.62, grade: margin + contentW * 0.75, gp: margin + contentW * 0.88 };
        doc.text("COURSE", cols.name, y + 10);
        doc.text("UNITS", cols.unit, y + 10);
        doc.text("GRADE", cols.grade, y + 10);
        doc.text("POINTS", cols.gp, y + 10);
        y += 16;

        sem.courses.forEach((course, ci) => {
          checkPage(18);
          doc.setFillColor(ci % 2 === 0 ? 22 : 26, ci % 2 === 0 ? 22 : 26, ci % 2 === 0 ? 22 : 26);
          doc.rect(margin, y, contentW, 16, "F");
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(210, 210, 210);
          doc.text(course.name || `Course ${ci + 1}`, cols.name, y + 10);
          doc.text(String(course.unit || ""), cols.unit, y + 10);
          doc.text(course.grade || "—", cols.grade, y + 10);
          doc.text(String(gradePoints(course.grade)), cols.gp, y + 10);
          y += 16;
        });
        y += 12;
      });
    }

    checkPage(40);
    y += 8;
    doc.setDrawColor(50, 50, 50);
    doc.line(margin, y, margin + contentW, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const gradeKey = GRADE_SCALES[gradingScale].map((r) => `${r.grade}=${r.points}`).join("  ·  ");
    doc.text(`Grade Key: ${gradeKey}`, margin, y);
    y += 14;
    doc.text("Generated by GPA Calculator", margin, y);

    doc.save("cgpa_prediction.pdf");
  }

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
            <button
              className={`${styles.actionBtn} ${styles.exportBtn}`}
              onClick={handleExport}
              disabled={!hasData}
            >
              <span className="material-icons" style={{ fontSize: "0.9rem" }}>picture_as_pdf</span>
              <span className={styles.btnText}>Export PDF</span>
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
