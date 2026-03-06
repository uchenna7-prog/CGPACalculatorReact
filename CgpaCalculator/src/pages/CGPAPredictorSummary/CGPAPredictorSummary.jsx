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
    const valid = s.courses.length > 0 &&
      s.courses.every((c) => c.unit !== "" && !isNaN(parseFloat(c.unit)));

    if (!valid) return { ...s, computedGpa: null };

    const tu = s.courses.reduce((sum, c) => sum + parseFloat(c.unit), 0);
    const tp = s.courses.reduce(
      (sum, c) => sum + parseFloat(c.unit) * GRADE_POINTS[c.grade],
      0
    );

    return { ...s, computedGpa: tu === 0 ? null : tp / tu };
  });

  const futureCourses = semesters.reduce((sum, s) => sum + s.courses.length, 0);

  const futureUnits = semesters.reduce(
    (sum, s) =>
      sum + s.courses.reduce((u, c) => u + (parseFloat(c.unit) || 0), 0),
    0
  );

  return (
    <div className={styles.pageContainer}>
      <SideBar />

      <div className={styles.mainWrapper}>
        <Header />

        <div className={styles.backBar}>
          <button
            className={styles.backBtn}
            onClick={() => navigate("/cgpaPredictor")}
          >
            <span className="material-icons">arrow_back</span>
            Back
          </button>
        </div>

        <main className={styles.mainContent}>

          <div className={styles.pageTitle}>
            <span className="material-icons">trending_up</span>
            <h2>Prediction Summary</h2>
          </div>

          {!hasData ? (
            <div className={styles.emptyState}>
              <span className="material-icons">pending_actions</span>

              <h3 className={styles.emptyTitle}>No prediction yet</h3>

              <p className={styles.emptySub}>
                Go to the CGPA Predictor, fill in your CGPA and future
                courses to generate a prediction.
              </p>

              <button
                className={styles.goBackBtn}
                onClick={() => navigate("/cgpaPredictor")}
              >
                Go to Predictor
              </button>
            </div>
          ) : (
            <>
              <div
                className={styles.heroBanner}
                style={{
                  background: `${predictedColor}15`,
                  borderColor: `${predictedColor}40`
                }}
              >
                <span className={styles.heroEmoji}>
                  {predictedHonours?.emoji ?? "📈"}
                </span>

                <div className={styles.heroMeta}>
                  <div
                    className={styles.heroCgpa}
                    style={{ color: predictedColor }}
                  >
                    {predictedCgpa.toFixed(2)}
                  </div>

                  <div className={styles.heroCgpaLabel}>
                    PREDICTED CGPA
                  </div>

                  {predictedHonours && (
                    <div
                      className={styles.heroHonours}
                      style={{ color: predictedColor }}
                    >
                      {predictedHonours.label}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.statsRow3}>
                <div className={styles.statCard}>
                  <div
                    className={styles.statValue}
                    style={{
                      color: !isNaN(currentVal)
                        ? getGpaColor(currentVal)
                        : "var(--accentGreen)"
                    }}
                  >
                    {!isNaN(currentVal) ? currentVal.toFixed(2) : "—"}
                  </div>
                  <div className={styles.statLabel}>CURRENT</div>
                </div>

                <div className={styles.statCard}>
                  <div
                    className={styles.statValue}
                    style={{ color: predictedColor }}
                  >
                    {predictedCgpa.toFixed(2)}
                  </div>
                  <div className={styles.statLabel}>PREDICTED</div>
                </div>

                <div className={styles.statCard}>
                  <div
                    className={styles.statValue}
                    style={{
                      color:
                        diff === null
                          ? "var(--textColor)"
                          : diff >= 0
                          ? "#34d399"
                          : "#f87171"
                    }}
                  >
                    {diff === null
                      ? "—"
                      : `${diff >= 0 ? "+" : ""}${diff.toFixed(2)}`}
                  </div>

                  <div className={styles.statLabel}>CHANGE</div>
                </div>
              </div>

              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <span className="material-icons">date_range</span>
                  <div className={styles.statValue}>{semesters.length}</div>
                  <div className={styles.statLabel}>FUTURE SEMESTERS</div>
                </div>

                <div className={styles.statCard}>
                  <span className="material-icons">book</span>
                  <div className={styles.statValue}>{futureCourses}</div>
                  <div className={styles.statLabel}>FUTURE COURSES</div>
                </div>

                <div className={styles.statCard}>
                  <span className="material-icons">straighten</span>
                  <div className={styles.statValue}>{futureUnits}</div>
                  <div className={styles.statLabel}>FUTURE UNITS</div>
                </div>

                <div className={styles.statCard}>
                  <span className="material-icons">history_edu</span>
                  <div className={styles.statValue}>{totalUnits}</div>
                  <div className={styles.statLabel}>UNITS SO FAR</div>
                </div>
              </div>

              <div className={styles.semesterSection}>
                <div className={styles.sectionTitle}>
                  SEMESTER BREAKDOWN
                </div>

                <div className={styles.semCards}>
                  {semSummaries.map((sem) => {
                    const gpaVal = sem.computedGpa;
                    const semUnits = sem.courses.reduce(
                      (u, c) => u + (parseFloat(c.unit) || 0),
                      0
                    );

                    const gpaCol =
                      gpaVal !== null
                        ? getGpaColor(gpaVal)
                        : "var(--textColor)";

                    const pct = gpaVal !== null ? (gpaVal / 5) * 100 : 0;

                    return (
                      <div key={sem.id} className={styles.semCard}>
                        <div className={styles.semLeft}>
                          <div className={styles.semName}>
                            Semester {sem.num}
                          </div>

                          <div className={styles.semMeta}>
                            <span>{sem.courses.length} courses</span>
                            <span>{semUnits} units</span>
                          </div>

                          {gpaVal !== null && (
                            <div className={styles.gpaBarTrack}>
                              <div
                                className={styles.gpaBarFill}
                                style={{
                                  width: `${pct}%`,
                                  background: gpaCol
                                }}
                              />
                            </div>
                          )}
                        </div>

                        <div
                          className={styles.semGpa}
                          style={{ color: gpaCol }}
                        >
                          {gpaVal !== null ? gpaVal.toFixed(2) : "—"}
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