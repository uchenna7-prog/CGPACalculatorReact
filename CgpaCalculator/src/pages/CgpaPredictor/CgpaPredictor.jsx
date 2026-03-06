import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import SideBar from "../../components/SideBar/SideBar";
import Header from "../../components/Header/Header";
import styles from "./CgpaPredictor.module.css";

const GRADES = ["A", "B", "C", "D", "E", "F"];
const GRADE_POINTS = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };

function createCourse() {
  return { id: Date.now() + Math.random(), code: "", unit: "", grade: "A" };
}

function createSemester(num) {
  return {
    id: `sem-${num}-${Date.now()}`,
    num,
    courses: [createCourse()],
    gpa: null,
  };
}

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

// ── Draggable Floating Button ──────────────────────────────────────────────
function FloatingButton({ onClick, icon, label, gradient }) {
  const btnRef = useRef(null);
  const dragging = useRef(false);
  const startPos = useRef({});
  const [dragPos, setDragPos] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const onPointerDown = (e) => {
    dragging.current = false;
    const rect = btnRef.current.getBoundingClientRect();
    startPos.current = { px: e.clientX, py: e.clientY, bx: rect.left, by: rect.top };
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
    setDragPos({ x: newX, y: newY });
  };

  const onPointerUp = () => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    if (!dragging.current) onClick();
  };

  const positionStyle = dragPos
    ? { position: "fixed", left: dragPos.x, top: dragPos.y }
    : { position: "fixed", right: 16, bottom: 30 };

  if (!mounted) return null;

  return createPortal(
    <button
      ref={btnRef}
      onPointerDown={onPointerDown}
      title={label}
      style={{
        ...positionStyle,
        width: 58, height: 58,
        borderRadius: "12px",
        background: gradient,
        border: "2px solid #1e2e26",
        boxShadow: "0 4px 20px rgba(0,0,0,0.45)",
        cursor: "grab",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 3, zIndex: 9999,
        userSelect: "none", touchAction: "none",
      }}
    >
      <span className="material-icons" style={{ fontSize: "1.5rem", color: "#fff", pointerEvents: "none" }}>
        {icon}
      </span>
      <span style={{
        fontSize: "0.48rem", color: "#fff",
        fontFamily: "Consolas, monospace", fontWeight: 700,
        letterSpacing: 0.5, pointerEvents: "none", opacity: 0.85,
      }}>
        {label}
      </span>
    </button>,
    document.body
  );
}

// ── Prediction Summary Modal ───────────────────────────────────────────────
function CgpaTrajectoryChart({ dataPoints }) {
  // dataPoints: [{ label, value, color }]
  const maxVal = 5;
  const chartH = 100;
  const chartW = 300;
  const padL = 28;
  const padB = 24;
  const padT = 10;
  const padR = 12;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const n = dataPoints.length;

  const xPos = (i) => padL + (i / (n - 1)) * innerW;
  const yPos = (v) => padT + innerH - (v / maxVal) * innerH;

  // build polyline points
  const pts = dataPoints.map((d, i) => `${xPos(i)},${yPos(d.value)}`).join(" ");

  // honour threshold lines
  const thresholds = [
    { label: "1st", value: 4.5, color: "#fbbf2460" },
    { label: "2:1", value: 3.5, color: "#34d39960" },
    { label: "2:2", value: 2.4, color: "#60a5fa60" },
    { label: "3rd", value: 1.5, color: "#f8717160" },
  ];

  return (
    <svg
      viewBox={`0 0 ${chartW} ${chartH}`}
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {/* Threshold lines */}
      {thresholds.map((t) => (
        <g key={t.label}>
          <line
            x1={padL} y1={yPos(t.value)}
            x2={chartW - padR} y2={yPos(t.value)}
            stroke={t.color} strokeWidth="1" strokeDasharray="3 3"
          />
          <text
            x={padL - 4} y={yPos(t.value) + 3.5}
            textAnchor="end"
            style={{ fontSize: 7, fill: t.color.replace("60", "cc"), fontFamily: "Consolas, monospace" }}
          >
            {t.label}
          </text>
        </g>
      ))}

      {/* X axis */}
      <line x1={padL} y1={padT + innerH} x2={chartW - padR} y2={padT + innerH}
        stroke="var(--borderColor)" strokeWidth="1" />

      {/* Gradient fill under line */}
      <defs>
        <linearGradient id="cgpaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4caf7d" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#4caf7d" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon
        points={`${padL},${padT + innerH} ${pts} ${xPos(n - 1)},${padT + innerH}`}
        fill="url(#cgpaGrad)"
      />

      {/* Line */}
      <polyline
        points={pts}
        fill="none"
        stroke="#4caf7d"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Points + labels */}
      {dataPoints.map((d, i) => (
        <g key={i}>
          <circle
            cx={xPos(i)} cy={yPos(d.value)} r={4}
            fill={d.color} stroke="var(--bg)" strokeWidth="1.5"
          />
          <text
            x={xPos(i)} y={yPos(d.value) - 7}
            textAnchor="middle"
            style={{ fontSize: 8, fill: d.color, fontFamily: "Consolas, monospace", fontWeight: "bold" }}
          >
            {d.value.toFixed(2)}
          </text>
          <text
            x={xPos(i)} y={padT + innerH + 13}
            textAnchor="middle"
            style={{ fontSize: 7, fill: "var(--textColor)", opacity: 0.5, fontFamily: "Consolas, monospace" }}
          >
            {d.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function PredictionSummaryModal({ currentCgpa, totalUnits, semesters, predictedCgpa, onClose }) {
  const hasData = predictedCgpa !== null;
  const currentVal = parseFloat(currentCgpa);
  const currentHonours = getHonours(isNaN(currentVal) ? null : currentVal);
  const predictedHonours = getHonours(predictedCgpa);
  const diff = hasData && !isNaN(currentVal) ? predictedCgpa - currentVal : null;
  const predictedColor = predictedCgpa !== null ? getGpaColor(predictedCgpa) : "var(--accentGreen)";

  // per-semester predicted GPAs
  const semSummaries = semesters.map((s) => {
    const valid = s.courses.length > 0 && s.courses.every(
      (c) => c.unit !== "" && !isNaN(parseFloat(c.unit))
    );
    if (!valid) return { ...s, computedGpa: null };
    const tu = s.courses.reduce((sum, c) => sum + parseFloat(c.unit), 0);
    const tp = s.courses.reduce((sum, c) => sum + parseFloat(c.unit) * GRADE_POINTS[c.grade], 0);
    return { ...s, computedGpa: tu === 0 ? null : tp / tu };
  });

  const futureCourses = semesters.reduce((sum, s) => sum + s.courses.length, 0);
  const futureUnits = semesters.reduce(
    (sum, s) => sum + s.courses.reduce((u, c) => u + (parseFloat(c.unit) || 0), 0), 0
  );

  // Build trajectory chart data: start = current CGPA, then rolling CGPA after each semester
  const chartPoints = (() => {
    if (!hasData || isNaN(currentVal)) return [];
    const points = [{ label: "Now", value: currentVal, color: getGpaColor(currentVal) }];
    let cumulativePoints = currentVal * parseFloat(totalUnits);
    let cumulativeUnits = parseFloat(totalUnits);
    semSummaries.forEach((s, i) => {
      const gpaVal = s.gpa !== null && s.gpa !== "error" ? s.gpa : s.computedGpa;
      const semUnits = s.courses.reduce((u, c) => u + (parseFloat(c.unit) || 0), 0);
      if (gpaVal !== null && semUnits > 0) {
        cumulativePoints += gpaVal * semUnits;
        cumulativeUnits += semUnits;
        const rollingCgpa = cumulativePoints / cumulativeUnits;
        points.push({
          label: `S${i + 1}`,
          value: parseFloat(rollingCgpa.toFixed(3)),
          color: getGpaColor(rollingCgpa),
        });
      }
    });
    return points;
  })();

  return createPortal(
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>

        {/* Header */}
        <div style={modalHeaderStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="material-icons" style={{ color: "var(--accentGreen)", fontSize: "1.1rem" }}>trending_up</span>
            <span style={headerTitleStyle}>PREDICTION SUMMARY</span>
          </div>
          <button onClick={onClose} style={closeStyle}>
            <span className="material-icons" style={{ fontSize: "1.1rem" }}>close</span>
          </button>
        </div>

        {!hasData ? (
          <div style={emptyStyle}>
            <span className="material-icons" style={{ fontSize: "3rem", color: "var(--accentGreen)", opacity: 0.4 }}>
              pending_actions
            </span>
            <p style={emptyTitleStyle}>No prediction yet</p>
            <p style={emptySubStyle}>
              Fill in your current CGPA, units taken, add future courses and hit Predict CGPA to see your summary.
            </p>
          </div>
        ) : (
          <div style={{ overflowY: "auto", display: "flex", flexDirection: "column" }}>

            {/* Predicted CGPA hero */}
            <div style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "20px",
              background: `${predictedColor}15`,
              borderBottom: `2px solid ${predictedColor}40`,
              flexShrink: 0,
            }}>
              <span style={{ fontSize: "2.8rem", lineHeight: 1 }}>
                {predictedHonours?.emoji ?? "📈"}
              </span>
              <div>
                <div style={{
                  fontFamily: "DM Sans, sans-serif", fontSize: "2.8rem",
                  fontWeight: 900, color: predictedColor, lineHeight: 1,
                }}>
                  {predictedCgpa.toFixed(2)}
                </div>
                <div style={{
                  fontFamily: "Consolas, monospace", fontSize: "0.65rem",
                  color: "var(--accentGreen)", opacity: 0.7, marginTop: 2, letterSpacing: 0.5,
                }}>
                  PREDICTED CGPA
                </div>
                {predictedHonours && (
                  <div style={{
                    fontFamily: "Consolas, monospace", fontSize: "0.7rem",
                    fontWeight: 700, color: predictedColor, marginTop: 4,
                    textTransform: "uppercase", letterSpacing: 0.5,
                  }}>
                    {predictedHonours.label}
                  </div>
                )}
              </div>
            </div>

            {/* Current vs Predicted vs Change */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8, padding: "14px 16px",
              borderBottom: "1px solid var(--borderColor)",
            }}>
              <div style={statCardStyle}>
                <div style={{ ...statValueStyle, color: !isNaN(currentVal) ? getGpaColor(currentVal) : "var(--accentGreen)" }}>
                  {!isNaN(currentVal) ? currentVal.toFixed(2) : "—"}
                </div>
                <div style={statLabelStyle}>CURRENT</div>
              </div>
              <div style={statCardStyle}>
                <div style={{ ...statValueStyle, color: predictedColor }}>
                  {predictedCgpa.toFixed(2)}
                </div>
                <div style={statLabelStyle}>PREDICTED</div>
              </div>
              <div style={statCardStyle}>
                <div style={{
                  ...statValueStyle,
                  color: diff === null ? "var(--textColor)" : diff >= 0 ? "#34d399" : "#f87171",
                }}>
                  {diff === null ? "—" : `${diff >= 0 ? "+" : ""}${diff.toFixed(2)}`}
                </div>
                <div style={statLabelStyle}>CHANGE</div>
              </div>
            </div>

            {/* Classification change banner */}
            {currentHonours && predictedHonours && currentHonours.label !== predictedHonours.label && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 10, padding: "10px 16px",
                borderBottom: "1px solid var(--borderColor)",
                background: `${predictedColor}0d`,
              }}>
                <span style={{ fontFamily: "Consolas, monospace", fontSize: "0.68rem", color: getGpaColor(currentVal), fontWeight: 700 }}>
                  {currentHonours.emoji} {currentHonours.label}
                </span>
                <span className="material-icons" style={{ fontSize: "0.9rem", color: "var(--accentGreen)", opacity: 0.6 }}>
                  arrow_forward
                </span>
                <span style={{ fontFamily: "Consolas, monospace", fontSize: "0.68rem", color: predictedColor, fontWeight: 700 }}>
                  {predictedHonours.emoji} {predictedHonours.label}
                </span>
              </div>
            )}

            {/* CGPA Trajectory Chart */}
            {chartPoints.length >= 2 && (
              <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--borderColor)" }}>
                <div style={sectionLabelStyle}>CGPA TRAJECTORY</div>
                <div style={{ marginTop: 10, padding: "8px 4px 0" }}>
                  <CgpaTrajectoryChart dataPoints={chartPoints} />
                </div>
              </div>
            )}

            {/* Stats grid */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: 8, padding: "14px 16px",
              borderBottom: "1px solid var(--borderColor)",
            }}>
              {[
                { label: "FUTURE SEMESTERS", value: semesters.length },
                { label: "FUTURE COURSES", value: futureCourses },
                { label: "FUTURE UNITS", value: futureUnits },
                { label: "UNITS SO FAR", value: totalUnits || "—" },
              ].map(({ label, value }) => (
                <div key={label} style={statCardStyle}>
                  <div style={statValueStyle}>{value}</div>
                  <div style={statLabelStyle}>{label}</div>
                </div>
              ))}
            </div>

            {/* Per-semester breakdown */}
            <div style={{ padding: "14px 16px" }}>
              <div style={sectionLabelStyle}>SEMESTER BREAKDOWN</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                {semSummaries.map((sem) => {
                  const gpaVal = sem.gpa !== null && sem.gpa !== "error" ? sem.gpa : sem.computedGpa;
                  const semUnits = sem.courses.reduce((u, c) => u + (parseFloat(c.unit) || 0), 0);
                  const gpaCol = gpaVal !== null ? getGpaColor(gpaVal) : "var(--textColor)";
                  const pct = gpaVal !== null ? (gpaVal / 5) * 100 : 0;
                  return (
                    <div key={sem.id} style={{
                      background: "var(--tableData)", border: "1px solid var(--borderColor)",
                      borderRadius: 8, padding: "10px 14px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{
                            fontFamily: "Consolas, monospace", fontSize: "0.82rem",
                            fontWeight: 600, color: "var(--textColor)",
                          }}>
                            Semester {sem.num}
                          </div>
                          <div style={{
                            fontFamily: "Consolas, monospace", fontSize: "0.65rem",
                            color: "var(--textColor)", opacity: 0.5, marginTop: 2,
                          }}>
                            {sem.courses.length} courses · {semUnits} units
                          </div>
                        </div>
                        <div style={{
                          fontFamily: "DM Sans, sans-serif", fontSize: "1.3rem",
                          fontWeight: 900, color: gpaCol,
                          opacity: gpaVal !== null ? 1 : 0.3,
                        }}>
                          {gpaVal !== null ? gpaVal.toFixed(2) : "—"}
                        </div>
                      </div>
                      {gpaVal !== null && (
                        <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: "var(--borderColor)", overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: gpaCol, borderRadius: 2 }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div style={footerStyle}>Nigerian 5-point scale · A=5 B=4 C=3 D=2 E=1 F=0</div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ── Shared modal styles ────────────────────────────────────────────────────
const overlayStyle = {
  position: "fixed", inset: 0,
  background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 10000, padding: 16,
};
const modalStyle = {
  background: "var(--bg)", border: "1px solid var(--borderColor)",
  borderRadius: 14, width: "100%", maxWidth: 420, maxHeight: "88vh",
  display: "flex", flexDirection: "column",
  boxShadow: "0 24px 64px rgba(0,0,0,0.45)", overflow: "hidden",
};
const modalHeaderStyle = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "14px 18px", borderBottom: "1px solid var(--borderColor)",
  background: "#1a2e22", flexShrink: 0,
};
const headerTitleStyle = {
  fontFamily: "Consolas, monospace", fontSize: "0.8rem",
  fontWeight: 700, letterSpacing: 1.5, color: "#a8cfb8",
};
const closeStyle = {
  background: "transparent", border: "none", color: "#a8cfb8",
  cursor: "pointer", display: "flex", alignItems: "center",
  justifyContent: "center", padding: 4, borderRadius: 6, opacity: 0.7,
};
const emptyStyle = {
  display: "flex", flexDirection: "column", alignItems: "center",
  justifyContent: "center", gap: 12, padding: "48px 32px", textAlign: "center",
};
const emptyTitleStyle = {
  fontFamily: "Consolas, monospace", fontSize: "1rem",
  fontWeight: 700, color: "var(--textColor)",
};
const emptySubStyle = {
  fontSize: "0.82rem", color: "var(--textColor)",
  opacity: 0.55, lineHeight: 1.6, maxWidth: 260,
};
const statCardStyle = {
  background: "var(--tableData)", border: "1px solid var(--borderColor)",
  borderRadius: 8, padding: "10px 6px", textAlign: "center",
};
const statValueStyle = {
  fontFamily: "DM Sans, sans-serif", fontSize: "1.4rem",
  fontWeight: 800, color: "var(--accentGreen)",
};
const statLabelStyle = {
  fontFamily: "Consolas, monospace", fontSize: "0.55rem",
  letterSpacing: 0.8, color: "var(--textColor)", opacity: 0.5, marginTop: 3,
};
const sectionLabelStyle = {
  fontFamily: "Consolas, monospace", fontSize: "0.6rem",
  fontWeight: 700, letterSpacing: 2, color: "var(--textColor)",
  opacity: 0.4, textTransform: "uppercase",
};
const footerStyle = {
  padding: "10px 18px", borderTop: "1px solid var(--borderColor)",
  fontFamily: "Consolas, monospace", fontSize: "0.65rem",
  color: "var(--textColor)", opacity: 0.35, flexShrink: 0,
  background: "var(--tableData)",
};

// ── Main Component ─────────────────────────────────────────────────────────
function CGPAPredictor() {
  const [currentCgpa, setCurrentCgpa] = useState("");
  const [totalUnits, setTotalUnits] = useState("");
  const [semesterCount, setSemesterCount] = useState("select");
  const [semesters, setSemesters] = useState([]);
  const [predictedCgpa, setPredictedCgpa] = useState(null);
  const [error, setError] = useState("");
  const [showSummary, setShowSummary] = useState(false);

  const handleSemesterCountChange = (e) => {
    const val = e.target.value;
    setSemesterCount(val);
    setPredictedCgpa(null);
    setError("");
    if (val === "select") { setSemesters([]); return; }
    const count = parseInt(val);
    setSemesters(Array.from({ length: count }, (_, i) => createSemester(i + 1)));
  };

  const updateCourse = (semId, courseId, field, value) => {
    setSemesters((prev) =>
      prev.map((s) =>
        s.id !== semId ? s : {
          ...s, gpa: null,
          courses: s.courses.map((c) => c.id !== courseId ? c : { ...c, [field]: value }),
        }
      )
    );
    setPredictedCgpa(null);
  };

  const addCourse = (semId) => {
    setSemesters((prev) =>
      prev.map((s) => s.id !== semId ? s : { ...s, courses: [...s.courses, createCourse()] })
    );
  };

  const deleteCourse = (semId, courseId) => {
    setSemesters((prev) =>
      prev.map((s) => {
        if (s.id !== semId) return s;
        return { ...s, courses: s.courses.filter((c) => c.id !== courseId), gpa: null };
      })
    );
  };

  const deleteAllCourses = (semId) => {
    setSemesters((prev) =>
      prev.map((s) => s.id !== semId ? s : { ...s, courses: [], gpa: null })
    );
  };

  const predictSemesterGPA = (semId) => {
    setSemesters((prev) =>
      prev.map((s) => {
        if (s.id !== semId) return s;
        const hasInvalid = s.courses.some((c) => c.unit === "" || isNaN(parseFloat(c.unit)));
        if (hasInvalid) return { ...s, gpa: "error" };
        const totalU = s.courses.reduce((sum, c) => sum + parseFloat(c.unit), 0);
        const totalP = s.courses.reduce((sum, c) => sum + parseFloat(c.unit) * GRADE_POINTS[c.grade], 0);
        return { ...s, gpa: totalU === 0 ? null : totalP / totalU };
      })
    );
  };

  const predictCGPA = () => {
    if (!currentCgpa || isNaN(parseFloat(currentCgpa))) { setError("Please enter your current CGPA."); return; }
    if (!totalUnits || isNaN(parseFloat(totalUnits))) { setError("Please enter your total course units taken so far."); return; }
    if (semesters.length === 0) { setError("Please select how many semesters ahead to predict."); return; }
    const allCourses = semesters.flatMap((s) => s.courses);
    const hasInvalid = allCourses.some((c) => c.unit === "" || isNaN(parseFloat(c.unit)));
    if (hasInvalid) { setError("Please fill all course units with valid numbers."); return; }
    const futureTotalUnits = allCourses.reduce((sum, c) => sum + parseFloat(c.unit), 0);
    const futureTotalPoints = allCourses.reduce((sum, c) => sum + parseFloat(c.unit) * GRADE_POINTS[c.grade], 0);
    const previousPoints = parseFloat(currentCgpa) * parseFloat(totalUnits);
    const cumulativePoints = previousPoints + futureTotalPoints;
    const cumulativeUnits = parseFloat(totalUnits) + futureTotalUnits;
    setError("");
    setPredictedCgpa(cumulativePoints / cumulativeUnits);
  };

  return (
    <div className={styles.pageContainer}>
      <SideBar />
      <div className={styles.mainWrapper}>
        <Header />
        <main className={styles.mainContent}>

          <div className={styles.initialInputs}>
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="current-cgpa">Enter your current CGPA:</label>
              <input id="current-cgpa" className={styles.textInput} type="number" step="0.01" min="0" max="5"
                value={currentCgpa}
                onChange={(e) => { setCurrentCgpa(e.target.value); setPredictedCgpa(null); setError(""); }}
                placeholder="e.g. 3.50" />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="total-units">Total course units taken so far:</label>
              <input id="total-units" className={styles.textInput} type="number" min="0"
                value={totalUnits}
                onChange={(e) => { setTotalUnits(e.target.value); setPredictedCgpa(null); setError(""); }}
                placeholder="e.g. 90" />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="semester-count">How many semesters ahead would you like to predict:</label>
              <select id="semester-count" className={styles.selectInput} value={semesterCount} onChange={handleSemesterCountChange}>
                <option value="select">Select</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {semesters.map((sem) => (
            <div key={sem.id}>
              <h2 className={styles.semesterHeading}>Semester {sem.num}</h2>
              <section className={styles.semesterCard}>
                {sem.courses.length > 0 ? (
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
                            <input className={styles.inputField} type="text" value={course.code}
                              onChange={(e) => updateCourse(sem.id, course.id, "code", e.target.value.toUpperCase())} />
                          </td>
                          <td>
                            <input className={styles.inputField} type="number" min="1" max="6" value={course.unit}
                              onChange={(e) => updateCourse(sem.id, course.id, "unit", e.target.value)} />
                          </td>
                          <td>
                            <select className={styles.selectField} value={course.grade}
                              onChange={(e) => updateCourse(sem.id, course.id, "grade", e.target.value)}>
                              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                            </select>
                          </td>
                          <td>
                            <button className={styles.deleteRowBtn} onClick={() => deleteCourse(sem.id, course.id)} title="Delete course">
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className={styles.noCoursesMsg}>No courses added.</p>
                )}

                {sem.gpa === "error" && <p className={styles.errorMsg}>Fill all course units with valid numbers.</p>}
                {sem.gpa !== null && sem.gpa !== "error" && (
                  <div className={styles.gpaResult}>PREDICTED SEMESTER GPA: {sem.gpa.toFixed(2)}</div>
                )}

                <div className={styles.semesterControls}>
                  <button className={styles.addCourseBtn} onClick={() => addCourse(sem.id)}>ADD COURSE</button>
                  <button className={styles.deleteAllBtn} onClick={() => deleteAllCourses(sem.id)}>DELETE ALL COURSES</button>
                  <button className={styles.predictGpaBtn} onClick={() => predictSemesterGPA(sem.id)}>PREDICT GPA</button>
                </div>
              </section>
            </div>
          ))}

          {semesters.length > 0 && (
            <>
              {error && <p className={styles.errorMsg}>{error}</p>}
              {predictedCgpa !== null && (
                <div className={styles.cgpaResult}>PREDICTED CGPA: {predictedCgpa.toFixed(2)}</div>
              )}
              <button className={styles.predictCgpaBtn} onClick={predictCGPA}>PREDICT CGPA</button>
            </>
          )}

          <div style={{ height: 80 }} />
        </main>
      </div>

      <FloatingButton
        onClick={() => setShowSummary(true)}
        icon="trending_up"
        label="PREDICT"
        gradient="linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)"
      />

      {showSummary && (
        <PredictionSummaryModal
          currentCgpa={currentCgpa}
          totalUnits={totalUnits}
          semesters={semesters}
          predictedCgpa={predictedCgpa}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
}

export default CGPAPredictor;
