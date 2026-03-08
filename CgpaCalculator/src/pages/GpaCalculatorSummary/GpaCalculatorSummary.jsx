import { useNavigate } from "react-router-dom";
import SideBar from "../../components/SideBar/SideBar";
import Header from "../../components/Header/Header";
import styles from "./GpaCalculatorSummary.module.css";
import { useGpaCalculator } from "../../contexts/GpaCalculatorContext";
import { useSettings } from "../../contexts/SettingsContext";

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

function GpaBarChart({ gradeBreakdown, totalCourses, gradingScale, getGpaColor }) {
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

  // Auto-calculation logic
  const validCourses = courses.filter(c => c.unit !== "" && !isNaN(parseFloat(c.unit)));
  const hasData = validCourses.length > 0;

  const totalUnits = validCourses.reduce((sum, c) => sum + parseFloat(c.unit), 0);
  const totalWeightedPoints = validCourses.reduce((sum, c) => sum + (parseFloat(c.unit) * gradePoints(c.grade)), 0);

  const gpaDisplay = totalUnits > 0 ? totalWeightedPoints / totalUnits : null;
  const honours = getHonours(gpaDisplay, gradingScale);
  const gpaColor = gpaDisplay !== null ? getGpaColor(gpaDisplay, gradingScale) : "var(--accentGreen)";

  const gradeBreakdown = availableGrades.map((g) => ({
    grade: g,
    count: courses.filter((c) => c.grade === g).length,
    points: gradePoints(g),
  })).filter((g) => g.count > 0);

  const highestGrade = gradeBreakdown.length > 0 ? gradeBreakdown[0].grade : "—";
  const lowestGrade = gradeBreakdown.length > 0 ? gradeBreakdown[gradeBreakdown.length - 1].grade : "—";

  // ── EXPORT TO PDF ──
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
      if (y + needed > pageH - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const hex2rgb = (hex) => {
      const h = hex.replace("#", "");
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    };

    const dp = Number(decimalPlaces);
    const maxPoints = gradingScale === "4point" ? 4 : 5;
    const resolvedGpaColor = gpaDisplay !== null ? getGpaColor(gpaDisplay, gradingScale) : "#34d399";
    const hColour = honours?.color || "#a78bfa";
    const [hr, hg, hb] = hex2rgb(hColour);

    // ── Header Banner ──
    doc.setFillColor(18, 18, 18);
    doc.rect(0, 0, pageW, 90, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("GPA Summary Report", margin, 38);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Generated on ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
      margin, 56
    );
    doc.text(`Grading Scale: ${gradingScale === "4point" ? "4.0 GPA" : "5.0 GPA (Nigerian)"}`, margin, 70);

    y = 110;

    // ── GPA Hero Banner ──
    const [gr2, gg2, gb2] = hex2rgb(resolvedGpaColor);
    doc.setFillColor(gr2, gg2, gb2);
    doc.setDrawColor(gr2, gg2, gb2);
    doc.setLineWidth(1);
    // Use explicit rgba-style fill with low alpha by drawing a semi-transparent rect
    doc.setFillColor(gr2, gg2, gb2, 0.1);
    doc.roundedRect(margin, y, contentW, 62, 6, 6, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);
    doc.setTextColor(gr2, gg2, gb2);
    doc.text(gpaDisplay?.toFixed(dp) ?? "0.00", margin + 16, y + 38);

    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text(`GPA  (${maxPoints}.0 SCALE)`, margin + 16, y + 52);

    if (honours) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(hr, hg, hb);
      doc.text(honours.label, pageW - margin - 16, y + 38, { align: "right" });
    }

    y += 80;

    // ── Stats Row ──
    const stats = [
      { label: "COURSES", value: courses.length },
      { label: "TOTAL UNITS", value: totalUnits },
      { label: "HIGHEST GRADE", value: highestGrade },
      { label: "LOWEST GRADE", value: lowestGrade },
    ];
    const cardW = (contentW - 12) / 4;
    stats.forEach((stat, i) => {
      const x = margin + i * (cardW + 4);
      doc.setFillColor(28, 28, 28);
      doc.setDrawColor(50, 50, 50);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, cardW, 48, 4, 4, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(52, 211, 153);
      doc.text(String(stat.value), x + cardW / 2, y + 26, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(130, 130, 130);
      doc.text(stat.label, x + cardW / 2, y + 40, { align: "center" });
    });

    y += 64;

    // ── Grade Distribution (bar chart drawn with jsPDF) ──
    checkPage(140);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text("GRADE DISTRIBUTION", margin, y);
    y += 4;
    doc.setDrawColor(50, 50, 50);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + contentW, y);
    y += 16;

    if (gradeBreakdown.length > 0) {
      const chartH = 90;
      const chartY = y;
      const maxCount = Math.max(...gradeBreakdown.map((g) => g.count), 1);
      const barAreaW = contentW;
      const barSlot = barAreaW / gradeBreakdown.length;
      const barW = Math.min(28, barSlot * 0.5);
      const innerH = chartH - 30; // leave room for labels

      gradeBreakdown.forEach((g, i) => {
        const col = getGpaColor(g.points, gradingScale);
        const [cr, cg, cb] = hex2rgb(col);
        const barH = (g.count / maxCount) * innerH;
        const x = margin + i * barSlot + barSlot / 2 - barW / 2;
        const barTop = chartY + (innerH - barH);

        doc.setFillColor(cr, cg, cb);
        doc.roundedRect(x, barTop, barW, barH, 2, 2, "F");

        // Count label above bar
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(cr, cg, cb);
        doc.text(String(g.count), x + barW / 2, barTop - 4, { align: "center" });

        // Grade label below
        doc.setFontSize(9);
        doc.text(g.grade, x + barW / 2, chartY + innerH + 14, { align: "center" });

        // Points sub-label
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text(`${g.points}pt`, x + barW / 2, chartY + innerH + 24, { align: "center" });
      });

      // Baseline
      doc.setDrawColor(50, 50, 50);
      doc.setLineWidth(0.5);
      doc.line(margin, chartY + innerH, margin + contentW, chartY + innerH);

      y += chartH + 16;
    }

    // ── Grade Breakdown ──
    checkPage(60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text("GRADE BREAKDOWN", margin, y);
    y += 4;
    doc.setDrawColor(50, 50, 50);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + contentW, y);
    y += 14;

    gradeBreakdown.forEach(({ grade, count, points }) => {
      checkPage(36);
      const pct = Math.round((count / courses.length) * 100);
      const gradeCol = getGpaColor(points, gradingScale);
      const [cr, cg, cb] = hex2rgb(gradeCol);
      const unitSum = courses
        .filter((c) => c.grade === grade)
        .reduce((s, c) => s + (parseFloat(c.unit) || 0), 0);

      // Row background
      doc.setFillColor(24, 24, 24);
      doc.setDrawColor(40, 40, 40);
      doc.roundedRect(margin, y, contentW, 30, 4, 4, "FD");

      // Grade badge
      doc.setFillColor(cr, cg, cb, 0.15);
      doc.setDrawColor(cr, cg, cb, 0.4);
      doc.roundedRect(margin + 8, y + 6, 28, 18, 3, 3, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(cr, cg, cb);
      doc.text(grade, margin + 22, y + 18, { align: "center" });

      // Meta text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.text(`${count} course${count !== 1 ? "s" : ""}  ·  ${unitSum} units`, margin + 46, y + 13);

      // Pct
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(cr, cg, cb);
      doc.text(`${pct}%`, pageW - margin - 8, y + 13, { align: "right" });

      // Progress bar
      const barX = margin + 46;
      const barW = contentW - 46 - 36;
      const barY2 = y + 21;
      doc.setFillColor(50, 50, 50);
      doc.roundedRect(barX, barY2, barW, 4, 2, 2, "F");
      if (pct > 0) {
        doc.setFillColor(cr, cg, cb);
        doc.roundedRect(barX, barY2, barW * (pct / 100), 4, 2, 2, "F");
      }

      y += 36;
    });

    // ── Footer ──
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

    doc.save("gpa_summary.pdf");
  }

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
              <span className="material-icons" style={{ fontSize: "4.5rem", color: "var(--accentGreen)", opacity: 0.3 }}>
                pending_actions
              </span>
              <h2 className={styles.emptyTitle}>No Data Found</h2>
              <p className={styles.emptySub}>Please add courses and units in the calculator first.</p>
              <button className={styles.goBackBtn} onClick={() => navigate("/gpaCalculator")}>Go to Calculator</button>
            </div>
          ) : (
            <>
              <div className={styles.pageTitle}>
                <span className="material-icons" style={{ fontSize: "1.3rem" }}>grade</span>
                <h2>GPA Summary</h2>
              </div>

              <div className={styles.heroBanner} style={{ background: `${gpaColor}15`, borderColor: `${gpaColor}40` }} >
                <span className={styles.heroEmoji}>{honours?.emoji ?? "📊"}</span>
                <div className={styles.heroMeta}>
                  <div className={styles.heroGpa} style={{ color: gpaColor }}> 
                    {gpaDisplay?.toFixed(Number(decimalPlaces)) || "0.00"} 
                  </div>
                  <div className={styles.heroGpaLabel}>GPA ({gradingScale === "4point" ? "4.0" : "5.0"} SCALE)</div>
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
                  <GpaBarChart 
                    gradeBreakdown={gradeBreakdown} 
                    totalCourses={courses.length} 
                    gradingScale={gradingScale} 
                    getGpaColor={getGpaColor} 
                  />
                </div>
              </div>

              <div className={styles.breakdownSection}>
                <div className={styles.sectionTitle}>GRADE BREAKDOWN</div>
                <div className={styles.breakdownList}>
                  {gradeBreakdown.map(({ grade, count, points }) => {
                    const pct = Math.round((count / courses.length) * 100);
                    const gradeCol = getGpaColor(points, gradingScale);
                    const unitSum = courses.filter(c => c.grade === grade).reduce((s, c) => s + (parseFloat(c.unit) || 0), 0);
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
