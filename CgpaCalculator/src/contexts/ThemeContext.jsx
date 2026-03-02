import { createContext,useContext,useState,useEffect} from "react";

const ThemeContext = createContext()

export function ThemeProvider({children}){
    const [theme,setTheme] = useState(()=>{
        return localStorage.getItem("theme") || "light-mode";
    })
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
      }, [theme]);
    
    const toggleTheme = ()=>{
        setTheme((prev) => prev === "light-mode"? "dark-mode":"light-mode")

    }
    return(
        <ThemeContext.Provider value={ { theme,toggleTheme} }>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => useContext(ThemeContext)