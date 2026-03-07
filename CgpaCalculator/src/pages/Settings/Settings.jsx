import { useState } from "react";
import SideBar from "../../components/SideBar/SideBar";
import Header from "../../components/Header/Header";
import styles from "./Settings.module.css";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";

function Toggle({ on, onToggle }) {
  return (
    <button
      className={`${styles.toggle} ${on ? styles.toggleOn : ""}`}
      onClick={onToggle}
    >
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
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path d="M3 6L8 11L13 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div className={`${styles.accordionBody} ${isOpen ? styles.accordionBodyOpen : ""}`}>
        <div className={styles.accordionContent}>{children}</div>
      </div>
    </div>
  );
}

function Settings() {
  const { theme, changeTheme } = useTheme();
  const {
    gradingScale,
    decimalPlaces,
    showGradePoints,
    showCreditSummary,
    confirmDelete,
    updateSetting,
    resetSettings,
    GRADE_SCALES,
  } = useSettings();

  const [openSection, setOpenSection] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");

  const toggleSection = (id) => setOpenSection((prev) => (prev === id ? null : id));

  const showMsg = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const handleReset = () => {
    changeTheme("light-mode");
    resetSettings();
    showMsg("All settings reset to default.");
  };

  const handleClearData = () => {
    if (window.confirm("Clear all saved calculator data? This cannot be undone.")) {
      Object.keys(localStorage)
        .filter((k) => k !== "cgpa_settings" && k !== "theme")
        .forEach((k) => localStorage.removeItem(k));
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

            {/* Appearance */}
            <AccordionSection
              icon="palette"
              title="Appearance"
              isOpen={openSection === "appearance"}
              onToggle={() => toggleSection("appearance")}
            >
              <div className={styles.settingRow}>
                <div className={styles.settingInfo}>
                  <span className={styles.settingLabel}>Theme Mode</span>
                </div>
                <div className={styles.themeOptions}>
                  {["dark-mode", "light-mode", "system-mode"].map((mode) => (
                    <button
                      key={mode}
                      className={`${styles.themeBtn} ${theme === mode ? styles.themeBtnActive : ""}`}
                      onClick={() => changeTheme(mode)}
                    >
                      <i className="material-icons">
                        {mode === "dark-mode" ? "dark_mode" : mode === "light-mode" ? "light_mode" : "settings_brightness"}
                      </i>
                      {mode.split('-')[0].charAt(0).toUpperCase() + mode.split('-')[0].slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </AccordionSection>

            {/* Display Preferences */}
            <AccordionSection
              icon="tune"
              title="Display Preferences"
              isOpen={openSection === "display"}
              onToggle={() => toggleSection("display")}
            >
              <div className={styles.settingRow}>
                <div className={styles.settingInfo}>
                  <span className={styles.settingLabel}>Show TCU Column</span>
                </div>
                <Toggle
                  on={showGradePoints}
                  onToggle={() => updateSetting("showGradePoints", !showGradePoints)}
                />
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingInfo}>
                  <span className={styles.settingLabel}>Show Credit Unit Summary</span>
                </div>
                <Toggle
                  on={showCreditSummary}
                  onToggle={() => updateSetting("showCreditSummary", !showCreditSummary)}
                />
              </div>
            </AccordionSection>

            {/* Data Management */}
            <AccordionSection
              icon="storage"
              title="Data Management"
              isOpen={openSection === "data"}
              onToggle={() => toggleSection("data")}
            >
              <div className={styles.settingRow}>
                <div className={styles.settingInfo}>
                  <span className={styles.settingLabel}>Confirm Before Deleting</span>
                </div>
                <Toggle
                  on={confirmDelete}
                  onToggle={() => updateSetting("confirmDelete", !confirmDelete)}
                />
              </div>
              <div className={styles.dangerZone}>
                <button className={styles.dangerBtn} onClick={handleClearData}>
                  Clear All Saved Data
                </button>
              </div>
            </AccordionSection>

          </div>
          {statusMsg && <p className={styles.statusMsg}>{statusMsg}</p>}
          <div className={styles.actionRow}>
            <button className={styles.resetBtn} onClick={handleReset}>Reset to Default</button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Settings;
