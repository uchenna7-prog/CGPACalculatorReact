import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light-mode";
  });

  useEffect(() => {
    // If system-mode, treat it as light-mode
    const appliedTheme = theme === "system-mode" ? "light-mode" : theme;

    document.documentElement.setAttribute("data-theme", appliedTheme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const changeTheme = (mode) => {
    setTheme(mode);
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);