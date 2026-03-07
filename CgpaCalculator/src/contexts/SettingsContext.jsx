import { createContext, useContext, useState, useEffect } from "react";

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

// ── DEFAULTS UPDATED ───────────────────────────────────────────────────────
const DEFAULTS = {
  gradingScale: "5point",
  decimalPlaces: "2",
  showGradePoints: true,   // Show TCU Column: ON
  showCreditSummary: true, // Show Credit Unit Summary: ON
  confirmDelete: false,    // Confirm Before Deleting: OFF
};

const STORAGE_KEY = "cgpa_settings";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // Merging defaults with saved to ensure new keys exist
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key, value) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const resetSettings = () => setSettings(DEFAULTS);

  const gradePoints = (grade) => {
    const row = GRADE_SCALES[settings.gradingScale].find((r) => r.grade === grade);
    return row ? row.points : 0;
  };

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
