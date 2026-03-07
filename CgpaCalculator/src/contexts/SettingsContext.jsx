import { createContext, useContext, useState, useEffect } from "react";

// ── Grade scale definitions ──
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

// ── Defaults ───────────────────────────────────────────────────────────────
const DEFAULTS = {
  gradingScale: "5point",
  decimalPlaces: "2",
  showGradePoints: true,
  showCreditSummary: true,
  confirmDelete: false,
};

const STORAGE_KEY = "cgpa_settings";

// ── Context ────────────────────────────────────────────────────────────────
const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
    } catch (_e) {
      return DEFAULTS;
    }
  });

  // Persist to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key, value) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const resetSettings = () => setSettings(DEFAULTS);

  // Resolve a grade letter → numeric points based on active scale
  const gradePoints = (grade) => {
    const row = GRADE_SCALES[settings.gradingScale].find((r) => r.grade === grade);
    return row ? row.points : 0;
  };

  // Grades available for the active scale (used to populate <select> in Home)
  const availableGrades = GRADE_SCALES[settings.gradingScale].map((r) => r.grade);

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        updateSetting,
        resetSettings,
        gradePoints,
        availableGrades,
        GRADE_SCALES,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}
