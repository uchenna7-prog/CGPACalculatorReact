import { createContext, useContext, useState, useEffect } from "react";

// ── Grade scale definitions ────────────────────────────────────────────────
export const GRADE_SCALES = {
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

// ── Honours thresholds ─────────────────────────────────────────────────────
export const HONOURS_THRESHOLDS = {
  "5point": [
    { min: 4.5,  label: "First Class Honours",        color: "#fbbf24", emoji: "🥇" },
    { min: 3.5,  label: "Second Class Upper (2:1)",   color: "#34d399", emoji: "🥈" },
    { min: 2.4,  label: "Second Class Lower (2:2)",   color: "#60a5fa", emoji: "🥉" },
    { min: 1.5,  label: "Third Class Honours",         color: "#f87171", emoji: "📋" },
    { min: 0,    label: "Pass",                        color: "#a78bfa", emoji: "📄" },
  ],
  "4point": [
    { min: 3.6,  label: "First Class Honours",        color: "#fbbf24", emoji: "🥇" },
    { min: 3.0,  label: "Second Class Upper (2:1)",   color: "#34d399", emoji: "🥈" },
    { min: 2.0,  label: "Second Class Lower (2:2)",   color: "#60a5fa", emoji: "🥉" },
    { min: 1.0,  label: "Third Class Honours",         color: "#f87171", emoji: "📋" },
    { min: 0,    label: "Pass",                        color: "#a78bfa", emoji: "📄" },
  ],
};

// ── Defaults ───────────────────────────────────────────────────────────────
const DEFAULTS = {
  gradingScale:      "5point",
  decimalPlaces:     "2",
  showGradePoints:   true,
  showCreditSummary: true,
  confirmDelete:     true,
};

const STORAGE_KEY = "cgpa_settings";

// ── Context ────────────────────────────────────────────────────────────────
const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  // Persist whenever settings change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Individual setters (mirrors the old local-state API so Settings.jsx stays clean)
  const setGradingScale      = (v) => setSettings((s) => ({ ...s, gradingScale: v }));
  const setDecimalPlaces     = (v) => setSettings((s) => ({ ...s, decimalPlaces: v }));
  const setShowGradePoints   = (fn) =>
    setSettings((s) => ({ ...s, showGradePoints: typeof fn === "function" ? fn(s.showGradePoints) : fn }));
  const setShowCreditSummary = (fn) =>
    setSettings((s) => ({ ...s, showCreditSummary: typeof fn === "function" ? fn(s.showCreditSummary) : fn }));
  const setConfirmDelete     = (fn) =>
    setSettings((s) => ({ ...s, confirmDelete: typeof fn === "function" ? fn(s.confirmDelete) : fn }));

  const resetSettings = () => setSettings(DEFAULTS);

  // Derived helpers consumed by other pages
  const gradePoints = (grade) => {
    const row = GRADE_SCALES[settings.gradingScale].find((r) => r.grade === grade);
    return row ? row.points : 0;
  };

  const getHonours = (cgpa) => {
    if (cgpa === null) return null;
    const thresholds = HONOURS_THRESHOLDS[settings.gradingScale];
    return thresholds.find((t) => cgpa >= t.min) ?? thresholds[thresholds.length - 1];
  };

  const formatGpa = (value) =>
    typeof value === "number" ? value.toFixed(Number(settings.decimalPlaces)) : value;

  const gradeList = GRADE_SCALES[settings.gradingScale].map((r) => r.grade);

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        setGradingScale,
        setDecimalPlaces,
        setShowGradePoints,
        setShowCreditSummary,
        setConfirmDelete,
        resetSettings,
        // Derived
        gradePoints,
        getHonours,
        formatGpa,
        gradeList,
        gradeScaleRows: GRADE_SCALES[settings.gradingScale],
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
}
