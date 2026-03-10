import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBar from "../../components/SideBar/SideBar";
import Header from "../../components/Header/Header";
import styles from "./Guide.module.css";

// ── Data ────────────────────────────────────────────────────────────────────

const scale5 = [
  { grade: "A", range: "70 – 100", points: "5.0", remark: "Excellent" },
  { grade: "B", range: "60 – 69",  points: "4.0", remark: "Very Good" },
  { grade: "C", range: "50 – 59",  points: "3.0", remark: "Good" },
  { grade: "D", range: "45 – 49",  points: "2.0", remark: "Fair" },
  { grade: "E", range: "40 – 44",  points: "1.0", remark: "Pass" },
  { grade: "F", range: "0 – 39",   points: "0.0", remark: "Fail" },
];

const scale4 = [
  { grade: "A", range: "70 – 100", points: "4.0", remark: "Excellent" },
  { grade: "B", range: "60 – 69",  points: "3.0", remark: "Very Good" },
  { grade: "C", range: "50 – 59",  points: "2.0", remark: "Good" },
  { grade: "D", range: "45 – 49",  points: "1.0", remark: "Fair" },
  { grade: "F", range: "0 – 44",   points: "0.0", remark: "Fail" },
];

const honours5 = [
  { cls: "First Class",            min: "4.50", max: "5.00", color: "#fbbf24" },
  { cls: "Second Class Upper (2:1)", min: "3.50", max: "4.49", color: "#34d399" },
  { cls: "Second Class Lower (2:2)", min: "2.40", max: "3.49", color: "#60a5fa" },
  { cls: "Third Class",            min: "1.50", max: "2.39", color: "#f87171" },
  { cls: "Pass",                   min: "1.00", max: "1.49", color: "#c4b5fd" },
  { cls: "Fail",                   min: "0.00", max: "0.99", color: "#f87171" },
];

const honours4 = [
  { cls: "First Class",            min: "3.60", max: "4.00", color: "#fbbf24" },
  { cls: "Second Class Upper (2:1)", min: "3.00", max: "3.59", color: "#34d399" },
  { cls: "Second Class Lower (2:2)", min: "2.00", max: "2.99", color: "#60a5fa" },
  { cls: "Third Class",            min: "1.00", max: "1.99", color: "#f87171" },
  { cls: "Fail",                   min: "0.00", max: "0.99", color: "#f87171" },
];

const faqs = [
  {
    q: "What is CGPA?",
    a: "CGPA stands for Cumulative Grade Point Average. It is the weighted average of all your semester GPAs across your entire academic programme, taking credit units into account.",
  },
  {
    q: "What grading scale does my school use?",
    a: "Most Nigerian universities use the 5.0 scale. However, some institutions — including some private universities — use the 4.0 scale. Check your student handbook or result portal to confirm yours.",
  },
  {
    q: "How is GPA for a single semester calculated?",
    a: "For each course, multiply the credit unit by the grade point to get the Quality Point (QP). Sum all QPs, then divide by the total credit units for that semester. The result is your semester GPA.",
  },
  {
    q: "How is CGPA calculated across multiple semesters?",
    a: "Add up the total Quality Points earned across all semesters, then divide by the total credit units registered across all semesters. This gives your cumulative GPA.",
  },
  {
    q: "Does a retaken course affect my CGPA?",
    a: "This depends on your school's policy. Some schools replace the old grade with the new one; others add both attempts. Always confirm with your academic affairs or registry office.",
  },
  {
    q: "Is this calculator official?",
    a: "No. This is an independent tool built to help students estimate their CGPA. Always verify results with your official transcript or your institution's portal.",
  },
  {
    q: "Can I use this for both 4.0 and 5.0 scales?",
    a: "Yes. Go to Settings and select your preferred grading scale. All calculations and grade point tables will update automatically.",
  },
  {
    q: "Why does my saved data disappear?",
    a: "Your data is saved in your browser's local storage. Clearing your browser data, using incognito/private mode, or switching browsers will remove it.",
  },
];

const tips = [
  { icon: "target", text: "Prioritise high-credit courses — they move your CGPA faster in both directions." },
  { icon: "refresh", text: "Use the CGPA Predictor before registration to see what GPA you need each semester to reach your target." },
  { icon: "trending_up", text: "A strong start compounds. A 4.5 in 100L protects your CGPA buffer for harder years." },
  { icon: "school", text: "If your school allows grade substitution for retakes, prioritise the courses where you scored E or F." },
  { icon: "lightbulb", text: "First Class on the 5.0 scale requires ≥ 4.50. That means mostly A grades with very few Bs." },
];

const exampleCourses = [
  { code: "MTH 101", unit: 3, grade: "A", gp: 5.0, qp: 15.0 },
  { code: "ENG 101", unit: 2, grade: "B", gp: 4.0, qp: 8.0  },
  { code: "PHY 101", unit: 3, grade: "C", gp: 3.0, qp: 9.0  },
  { code: "CHM 101", unit: 2, grade: "A", gp: 5.0, qp: 10.0 },
];
const totalUnits = exampleCourses.reduce((s, c) => s + c.unit, 0);
const totalQP    = exampleCourses.reduce((s, c) => s + c.qp, 0);
const exampleGPA = (totalQP / totalUnits).toFixed(2);

// ── Components ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionIconWrap}>
        <i className="material-icons">{icon}</i>
      </div>
      <div>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
      </div>
    </div>
  );
}

function GradeTable({ data, scale }) {
  return (
    <div className={styles.tableWrap}>
      <div className={styles.tableLabel}>{scale} Scale</div>
      <table className={styles.gradeTable}>
        <thead>
          <tr>
            <th>Grade</th>
            <th>Score Range</th>
            <th>Grade Points</th>
            <th>Remark</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.grade}>
              <td><span className={styles.gradeBadge}>{row.grade}</span></td>
              <td>{row.range}</td>
              <td><strong>{row.points}</strong></td>
              <td className={row.grade === "F" ? styles.failText : ""}>{row.remark}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HonoursTable({ data, scale }) {
  return (
    <div className={styles.tableWrap}>
      <div className={styles.tableLabel}>{scale} Scale</div>
      <table className={styles.gradeTable}>
        <thead>
          <tr>
            <th>Classification</th>
            <th>Min CGPA</th>
            <th>Max CGPA</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.cls}>
              <td>
                <span className={styles.clsDot} style={{ background: row.color }} />
                {row.cls}
              </td>
              <td>{row.min}</td>
              <td>{row.max}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`${styles.faqItem} ${open ? styles.faqOpen : ""}`}>
      <button className={styles.faqQuestion} onClick={() => setOpen(p => !p)}>
        <span>{q}</span>
        <svg
          className={`${styles.faqArrow} ${open ? styles.faqArrowOpen : ""}`}
          width="16" height="16" viewBox="0 0 16 16" fill="none"
        >
          <path d="M3 6L8 11L13 6" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className={`${styles.faqAnswer} ${open ? styles.faqAnswerOpen : ""}`}>
        <p>{a}</p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function Guide() {
  const navigate = useNavigate();

  return (
    <div className={styles.pageContainer}>
      <SideBar />
      <div className={styles.mainWrapper}>
        <Header title="Guide" />

        <div className={styles.backBar}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <span className="material-icons" style={{ fontSize: "0.9rem" }}>arrow_back</span>
            <span className={styles.btnText}>Back</span>
          </button>
        </div>

        <main className={styles.mainContent}>
          {/* Hero */}
          <div className={styles.hero}>
            <div className={styles.heroInner}>
              <div className={styles.heroBadge}>
                <i className="material-icons">menu_book</i>
                <span>Guide & FAQ</span>
              </div>
              <h1 className={styles.heroTitle}>
                Everything you need to know about <span className={styles.heroAccent}>CGPA</span>
              </h1>
              <p className={styles.heroSub}>
                Grading scales, calculation methods, honours classifications, and answers to common questions — all in one place.
              </p>
            </div>
          </div>

          <div className={styles.content}>
            {/* ── How CGPA is Calculated ── */}
            <section className={styles.section}>
              <SectionHeader
                icon="functions"
                title="How CGPA is Calculated"
                subtitle="A step-by-step walkthrough of the formula Nigerian universities use"
              />

              <div className={styles.stepsGrid}>
                <div className={styles.step}>
                  <div className={styles.stepNum}>1</div>
                  <div>
                    <h4>Get your grade point</h4>
                    <p>Each letter grade maps to a grade point depending on your school's scale (see tables below).</p>
                  </div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNum}>2</div>
                  <div>
                    <h4>Calculate Quality Points (QP)</h4>
                    <p>For each course: <code>QP = Credit Unit × Grade Point</code></p>
                  </div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNum}>3</div>
                  <div>
                    <h4>Sum across all courses</h4>
                    <p>Add up all QPs and all credit units for every semester you've completed.</p>
                  </div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNum}>4</div>
                  <div>
                    <h4>Divide to get CGPA</h4>
                    <p><code>CGPA = Total QP ÷ Total Credit Units</code></p>
                  </div>
                </div>
              </div>

              {/* Worked Example */}
              <div className={styles.exampleBox}>
                <div className={styles.exampleLabel}>
                  <i className="material-icons">info</i>
                  Worked Example — Semester 1 (5.0 Scale)
                </div>
                <div className={styles.exampleTableWrap}>
                  <table className={styles.gradeTable}>
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Units</th>
                        <th>Grade</th>
                        <th>Grade Points</th>
                        <th>Quality Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exampleCourses.map(c => (
                        <tr key={c.code}>
                          <td>{c.code}</td>
                          <td>{c.unit}</td>
                          <td><span className={styles.gradeBadge}>{c.grade}</span></td>
                          <td>{c.gp.toFixed(1)}</td>
                          <td>{c.qp.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className={styles.tfootRow}>
                        <td colSpan={1}><strong>Total</strong></td>
                        <td><strong>{totalUnits}</strong></td>
                        <td colSpan={2}></td>
                        <td><strong>{totalQP.toFixed(1)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className={styles.exampleResult}>
                  <span>GPA = {totalQP.toFixed(1)} ÷ {totalUnits} = </span>
                  <strong className={styles.exampleGpa}>{exampleGPA}</strong>
                </div>
              </div>
            </section>

            {/* ── Grading Scales ── */}
            <section className={styles.section}>
              <SectionHeader
                icon="grade"
                title="Nigerian Grading Scales"
                subtitle="Grade-to-point mappings for both systems used across Nigerian universities"
              />
              <div className={styles.tablesRow}>
                <GradeTable data={scale5} scale="5.0" />
                <GradeTable data={scale4} scale="4.0" />
              </div>
              <p className={styles.noteText}>
                <i className="material-icons" style={{ fontSize: "15px", verticalAlign: "middle", marginRight: "5px" }}>info</i>
                Not sure which scale your school uses? Check your result portal or student handbook. You can also change the active scale in <strong>Settings</strong>.
              </p>
            </section>

            {/* ── Honours Classification ── */}
            <section className={styles.section}>
              <SectionHeader
                icon="emoji_events"
                title="Honours Classification"
                subtitle="CGPA ranges for degree classifications on both scales"
              />
              <div className={styles.tablesRow}>
                <HonoursTable data={honours5} scale="5.0" />
                <HonoursTable data={honours4} scale="4.0" />
              </div>
              <p className={styles.noteText}>
                <i className="material-icons" style={{ fontSize: "15px", verticalAlign: "middle", marginRight: "5px" }}>warning</i>
                Some universities set slightly different cut-offs. These are the most widely used thresholds across Nigerian institutions.
              </p>
            </section>

            {/* ── Tips ── */}
            <section className={styles.section}>
              <SectionHeader
                icon="lightbulb"
                title="Tips to Protect & Improve Your CGPA"
              />
              <div className={styles.tipsList}>
                {tips.map((tip, i) => (
                  <div key={i} className={styles.tipItem}>
                    <div className={styles.tipIcon}>
                      <i className="material-icons">check_circle</i>
                    </div>
                    <p>{tip.text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── FAQ ── */}
            <section className={styles.section}>
              <SectionHeader
                icon="help_outline"
                title="Frequently Asked Questions"
              />
              <div className={styles.faqList}>
                {faqs.map((faq, i) => (
                  <FaqItem key={i} q={faq.q} a={faq.a} />
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
