"use client";

import { createContext, useContext, useEffect, useState } from "react";

type ThemeContextType = {
  isLightMode: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("aifinder-theme");
    setIsLightMode(savedTheme === "light");
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isLightMode;
    setIsLightMode(nextTheme);
    localStorage.setItem("aifinder-theme", nextTheme ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ isLightMode, toggleTheme }}>
      <div className={isLightMode ? "theme-light" : "theme-dark"}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}