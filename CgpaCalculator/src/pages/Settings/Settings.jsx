import { useState } from "react";
import SideBar from "../../components/SideBar/SideBar";
import Header from "../../components/Header/Header";
import styles from "./Settings.module.css";

const gradeScales = {
  "5point": [
    { grade: "A", points: 5, range: "70 – 100" },
    { grade: "B", points: 4, range: "60 – 69" },
    { grade: "C", points: 3, range: "50 – 59" },
    { grade: "D", points: 2, range: "45 – 49" },
    { grade: "E", points: 1, range: "40 – 44" },
    { grade: "F", points: 0, range: "0 – 39" },
  ],
  "4point": [
    { grade: "A", points: 4, range: "70 – 100" },
    { grade: "B", points: 3, range: "60 – 69" },
    { grade: "C", points: 2, range: "50 – 59" },
    { grade: "D", points: 1, range: "45 – 49" },
    { grade: "F", points: 0, range: "0 – 44" },
  ],
};

function Toggle({ on, onToggle }) {
  return (
    <button className={`${styles.toggle} ${on ? styles.toggleOn : ""}`} onClick={onToggle}>
      <span className={styles.toggleThumb} />
    </button>
  );
}

function AccordionSection({ icon, title, isOpen, onToggle, children }) {
  return (
    <div className={`${styles.accordionItem} ${isOpen ? styles.accordionOpen : ""}`}>
      <button className={styles.accordionHeader} onClick={onToggle}>
        <div className={styles.accordionHeaderLeft}>
          <i className="material-icons">{icon}</i>
          <span>{title}</span>
        </div>
        <svg
          className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ""}`}
          width="16" height="16" viewBox="0 0 16 16" fill="none"
        >
          <path d="M3 6L8 11L13 6" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className={`${styles.accordionBody} ${isOpen ? styles.accordionBodyOpen : ""}`}>
        <div className={styles.accordionContent}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Settings() {
  const [openSection, setOpenSection] = useState(null);

  const [theme, setTheme] = useState("dark");
  const [gradingScale, setGradingScale] = useState("5point");
  const [decimalPlaces, setDecimalPlaces] = useState("2");
  const [showGradePoints, setShowGradePoints] = useState(true);
  const [showCreditSummary, setShowCreditSummary] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");

  const toggleSection = (id) =>
    setOpenSection((prev) => (prev === id ? null : id));

  const showMsg = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const handleReset = () => {
    setTheme("dark");
    setGradingScale("5point");
    setDecimalPlaces("2");
    setShowGradePoints(true);
    setShowCreditSummary(true);
    setConfirmDelete(true);
    showMsg("All settings reset to default.");
  };

  const handleClearData = () => {
    if (window.confirm("Clear all saved calculator data? This cannot be undone.")) {
      localStorage.clear();
      showMsg("All saved data cleared.");
    }
  };

  return (
    <div className={styles.pageContainer}>
      <SideBar />
      <div className={styles.mainWrapper}>
        <Header />
        <main className={styles.mainContent}>

          <div className={styles.accordionList}>

            {/* ── Appearance ── */}
            <AccordionSection
              icon="palette"
              title="Appearance"
              isOpen={openSection === "appearance"}
              onToggle={() => toggleSection("appearance")}
            >
              <div className={styles.settingRow}>
                <div className={styles.settingInfo}>
                  <span className={styles.settingLabel}>Theme Mode</span>
                  <span className={styles.settingDesc}>Choose how the app looks</span>
                </div>
                <div className={styles.themeOptions}>
                  {[
                    { key: "dark", icon: "dark_mode", label: "Dark" },
                    { key: "light", icon: "light_mode", label: "Light" },
                    { key: "system", icon: "settings_brightness", label: "System" },
                  ].map((t) => (
                    <button
                      key={t.key}
                      className={`${styles.themeBtn} ${theme === t.key ? styles.themeBtnActive : ""}`}
                      onClick={() => setTheme(t.key)}
                    >
                      <i className="material-icons">{t.icon}</i>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </AccordionSection>

            {/* ── Grading Scale ── */}
            <AccordionSection
              icon="grade"
              title="Grading Scale"
              isOpen={openSection === "grading"}
              onToggle={() => toggleSection("grading")}
            >
              <div className={styles.settingRow}>
                <div className={styles.settingInfo}>
                  <span className={styles.settingLabel}>Scale Type</span>
                  <span className={styles.settingDesc}>Select your institution's grading system</span>
                </div>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input type="radio" value="5point"
                      checked={gradingScale === "5point"}
                      onChange={(e) => setGradingScale(e.target.value)} />
                    5-Point Scale (Most Nigerian Universities)
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" value="4point"
                      checked={gradingScale === "4point"}
                      onChange={(e) => setGradingScale(e.target.value)} />
                    4-Point Scale
                  </label>
                </div>
              </div>

              <div className={styles.gradeTableWrap}>
                <p className={styles.gradeTableTitle}>
                  Preview — {gradingScale === "5point" ? "5-Point" : "4-Point"} Scale
                </p>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Grade</th>
                      <th>Points</th>
                      <th>Score Range (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradeScales[gradingScale].map((row) => (
                      <tr key={row.grade}>
                        <td>{row.grade}</td>
                        <td>{row.points}</td>
                        <td>{row.range}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AccordionSection>

            {/* ── Display Preferences ── */}
            <AccordionSection
              icon="tune"
              title="Display Preferences"
              isOpen={openSection === "display"}
              onToggle={() => toggleSection("display")}
            >
              <div className={styles.settingRow}>
                <div className={styles.settingInfo}>
                  <span className={styles.settingLabel}>Decimal Places</span>
                  <span className={styles.settingDesc}>Number of decimal places shown in GPA/CGPA results</span>
                </div>
                <select
                  className={styles.selectInput}
                  value={decimalPlaces}
                  onChange={(e) => setDecimalPlaces(e.target.value)}
                >
                  <option value="1">1 — e.g. 4.5</option>
                  <option value="2">2 — e.g. 4.50</option>
                  <option value="3">3 — e.g. 4.500</option>
                </select>
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingInfo}>
                  <span className={styles.settingLabel}>Show Grade Points Column</span>
                  <span className={styles.settingDesc}>Display grade point value alongside each grade</span>
                </div>
                <Toggle on={showGradePoints} onToggle={() => setShowGradePoints((p) => !p)} />
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingInfo}>
                  <span className={styles.settingLabel}>Show Credit Unit Summary</span>
                  <span className={styles.settingDesc}>Show total credit units loaded per semester</span>
                </div>
                <Toggle on={showCreditSummary} onToggle={() => setShowCreditSummary((p) => !p)} />
              </div>
            </AccordionSection>

            {/* ── Data Management ── */}
            <AccordionSection
              icon="storage"
              title="Data Management"
              isOpen={openSection === "data"}
              onToggle={() => toggleSection("data")}
            >
              <div className={styles.settingRow}>
                <div className={styles.settingInfo}>
                  <span className={styles.settingLabel}>Confirm Before Deleting</span>
                  <span className={styles.settingDesc}>Show a prompt before deleting courses or semesters</span>
                </div>
                <Toggle on={confirmDelete} onToggle={() => setConfirmDelete((p) => !p)} />
              </div>

              <div className={styles.dangerZone}>
                <h4 className={styles.dangerTitle}>
                  <i className="material-icons">warning</i> Danger Zone
                </h4>
                <p className={styles.dangerDesc}>
                  This action is irreversible. All saved calculator data will be permanently deleted.
                </p>
                <button className={styles.dangerBtn} onClick={handleClearData}>
                  <i className="material-icons">delete_forever</i>
                  Clear All Saved Data
                </button>
              </div>
            </AccordionSection>

          </div>

          {/* Status message + actions */}
          {statusMsg && <p className={styles.statusMsg}>{statusMsg}</p>}

          <div className={styles.actionRow}>
            <button className={styles.resetBtn} onClick={handleReset}>
              Reset to Default
            </button>
          </div>

        </main>
      </div>
    </div>
  );
}

export default Settings;