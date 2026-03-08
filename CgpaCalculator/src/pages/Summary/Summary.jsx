import { useNavigate } from "react-router-dom";
import SideBar from "../../components/SideBar/SideBar";
import Header from "../../components/Header/Header";
import styles from "./Summary.module.css";
import { useGpa } from "../../contexts/GpaContext";
import { useSettings } from "../../contexts/SettingsContext";

const SEMESTER_NAMES = { 1: "First", 2: "Second" };

function getHonours(cgpa, scale) {
  if (!cgpa) return null;
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
  const { semesters } = useGpa();
  const { gradingScale, GRADE_SCALES, gradePoints, decimalPlaces } = useSettings();

  const dp = Number(decimalPlaces);
  const maxPoints = gradingScale === "4point" ? 4 : 5;

  // ── AUTO-CALCULATION LOGIC ──
  // This calculates everything instantly without needing the "Calculate" button
  let totalWeightedPoints = 0;
  let totalUnitsAccumulated = 0;

  const computedSemesters = semesters.map((s) => {
    const semUnits = s.courses.reduce((sum, c) => sum + (parseFloat(c.unit) || 0), 0);
    const semPoints = s.courses.reduce(
      (sum, c) => sum + (parseFloat(c.unit) || 0) * gradePoints(c.grade),
      0
    );

    totalWeightedPoints += semPoints;
    totalUnitsAccumulated += semUnits;

    return {
      ...s,
      computedGpa: semUnits > 0 ? semPoints / semUnits : null,
      semUnits
    };
  });

  const autoCgpa = totalUnitsAccumulated > 0 ? totalWeightedPoints / totalUnitsAccumulated : null;
  const honours = getHonours(autoCgpa, gradingScale);

  // Grouping for display
  const byYear = computedSemesters.reduce((acc, s) => {
    if (!acc[s.year]) acc[s.year] = [];
    acc[s.year].push(s);
    return acc;
  }, {});

  const totalCourses = semesters.reduce((sum, s) => sum + s.courses.length, 0);
  const hasData = totalCourses > 0 && totalUnitsAccumulated > 0;

  // ── EXPORT TO PDF ──
  async function handleExport() {
    // Dynamically load jsPDF from CDN
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

    // ── Helpers ──
    const checkPage = (needed = 20) => {
      if (y + needed > pageH - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const hex2rgb = (hex) => {
      const h = hex.replace("#", "");
      return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
    };

    // ── Header Banner ──
    doc.setFillColor(18, 18, 18);
    doc.rect(0, 0, pageW, 90, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Academic Summary Report", margin, 38);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 160, 160);
    doc.text(`Generated on ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, margin, 56);
    doc.text(`Grading Scale: ${gradingScale === "4point" ? "4.0 GPA" : "5.0 GPA"}`, margin, 70);

    y = 110;

    // ── Honours Banner ──
    const hColour = honours?.color || "#a78bfa";
    const [hr, hg, hb] = hex2rgb(hColour);
    doc.setFillColor(hr, hg, hb, 0.12);
    doc.setDrawColor(hr, hg, hb);
    doc.setLineWidth(1);
    doc.roundedRect(margin, y, contentW, 62, 6, 6, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(hr, hg, hb);
    doc.text(autoCgpa?.toFixed(dp) ?? "—", margin + 16, y + 36);

    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text(`OVERALL CGPA  (${maxPoints}.0 SCALE)`, margin + 16, y + 50);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(hr, hg, hb);
    doc.text(honours?.label || "Pass", pageW - margin - 16, y + 36, { align: "right" });

    y += 80;

    // ── Stats Row ──
    const stats = [
      { label: "YEARS", value: Object.keys(byYear).length },
      { label: "SEMESTERS", value: semesters.length },
      { label: "COURSES", value: totalCourses },
      { label: "TOTAL UNITS", value: totalUnitsAccumulated },
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
      doc.setTextColor(52, 211, 153); // accentGreen
      doc.text(String(stat.value), x + cardW / 2, y + 26, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(130, 130, 130);
      doc.text(stat.label, x + cardW / 2, y + 40, { align: "center" });
    });

    y += 64;

    // ── Semester Breakdown ──
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text("SEMESTER BREAKDOWN", margin, y);
    y += 4;
    doc.setDrawColor(50, 50, 50);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + contentW, y);
    y += 16;

    Object.entries(byYear).forEach(([year, yearSems]) => {
      checkPage(40);

      // Year chip
      doc.setFillColor(40, 40, 40);
      doc.roundedRect(margin, y - 12, 52, 18, 4, 4, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(200, 200, 200);
      doc.text(`YEAR ${year}`, margin + 26, y, { align: "center" });
      y += 14;

      yearSems.forEach((sem) => {
        checkPage(120);

        const semLabel = `${SEMESTER_NAMES[sem.semesterNum]} Semester`;
        const gpaVal = sem.computedGpa;
        const gpaColor = gpaVal !== null ? getGpaColor(gpaVal, gradingScale) : "#888888";
        const [gr, gg, gb] = hex2rgb(gpaColor);
        const pct = gpaVal !== null ? gpaVal / maxPoints : 0;

        // Sem card background
        doc.setFillColor(24, 24, 24);
        doc.setDrawColor(45, 45, 45);
        doc.roundedRect(margin, y, contentW, 36, 4, 4, "FD");

        // Sem name
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(230, 230, 230);
        doc.text(semLabel, margin + 12, y + 14);

        // Meta
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(130, 130, 130);
        doc.text(`${sem.courses.length} courses  ·  ${sem.semUnits} units`, margin + 12, y + 26);

        // GPA value
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(gr, gg, gb);
        doc.text(gpaVal !== null ? gpaVal.toFixed(dp) : "—", pageW - margin - 80, y + 20, { align: "right" });

        // GPA bar track
        const barX = pageW - margin - 72;
        const barW = 60;
        const barY = y + 26;
        doc.setFillColor(50, 50, 50);
        doc.roundedRect(barX, barY, barW, 4, 2, 2, "F");
        if (pct > 0) {
          doc.setFillColor(gr, gg, gb);
          doc.roundedRect(barX, barY, barW * pct, 4, 2, 2, "F");
        }

        y += 42;

        // Course table header
        checkPage(20);
        const cols = { name: margin + 8, unit: margin + contentW * 0.62, grade: margin + contentW * 0.75, gp: margin + contentW * 0.88 };

        doc.setFillColor(35, 35, 35);
        doc.rect(margin, y, contentW, 16, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 100, 100);
        doc.text("COURSE", cols.name, y + 10);
        doc.text("UNITS", cols.unit, y + 10);
        doc.text("GRADE", cols.grade, y + 10);
        doc.text("POINTS", cols.gp, y + 10);
        y += 16;

        // Course rows
        sem.courses.forEach((course, idx) => {
          checkPage(18);
          const rowBg = idx % 2 === 0 ? [22, 22, 22] : [26, 26, 26];
          doc.setFillColor(...rowBg);
          doc.rect(margin, y, contentW, 16, "F");

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(210, 210, 210);
          doc.text(course.name || `Course ${idx + 1}`, cols.name, y + 10);
          doc.text(String(course.unit || ""), cols.unit, y + 10);
          doc.text(course.grade || "—", cols.grade, y + 10);
          doc.text(String(gradePoints(course.grade)), cols.gp, y + 10);
          y += 16;
        });

        y += 12;
      });

      y += 6;
    });

    // ── Footer ──
    checkPage(40);
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

    doc.save("academic_summary.pdf");
  }

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
              <span className="material-icons" style={{ fontSize: "4rem", color: "var(--accentGreen)", opacity: 0.4 }}>
                pending_actions
              </span>
              <h2 className={styles.emptyTitle}>No Data Found</h2>
              <p className={styles.emptySub}>Please add courses and units in the calculator first.</p>
              <button className={styles.goBackBtn} onClick={() => navigate("/")}>Go to Calculator</button>
            </div>
          ) : (
            <>
              {/* Centered Honours Banner */}
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
                    {autoCgpa?.toFixed(dp)}
                  </div>
                  <div className={styles.cgpaLabel}>OVERALL CGPA ({maxPoints}.0 SCALE)</div>
                  <div className={styles.honoursLabel} style={{ color: honours?.color || "#a78bfa" }}>
                    {honours?.label || "Pass"}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className={styles.statsGrid}>
                {[
                  { label: "YEARS", value: Object.keys(byYear).length, icon: "calendar_today" },
                  { label: "SEMESTERS", value: semesters.length, icon: "date_range" },
                  { label: "COURSES", value: totalCourses, icon: "book" },
                  { label: "TOTAL UNITS", value: totalUnitsAccumulated, icon: "straighten" },
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
                        const gpaVal = sem.computedGpa;
                        const gpaColor = gpaVal !== null ? getGpaColor(gpaVal, gradingScale) : "var(--textColor)";
                        const pct = gpaVal !== null ? (gpaVal / maxPoints) * 100 : 0;

                        return (
                          <div key={sem.id} className={styles.semCard}>
                            <div className={styles.semLeft}>
                              <div className={styles.semName}>{SEMESTER_NAMES[sem.semesterNum]} Semester</div>
                              <div className={styles.semMeta}>
                                <span>{sem.courses.length} courses</span>
                                <span>{sem.semUnits} units</span>
                              </div>
                            </div>
                            <div className={styles.semRight}>
                              <div className={styles.semGpa} style={{ color: gpaColor }}>
                                {gpaVal !== null ? gpaVal.toFixed(dp) : "0.00"}
                              </div>
                              <div className={styles.gpaBarTrack}>
                                <div className={styles.gpaBarFill} style={{ width: `${pct}%`, background: gpaColor }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.footer}>
                <div>Current Scale: {gradingScale === "4point" ? "4.0 GPA" : "5.0 GPA"}</div>
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

export default Summary;
