"use client";

import { createContext, useCallback, useContext, useEffect } from "react";

type ThemeContextType = {
  isLightMode: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isLightMode = true;

  useEffect(() => {
    localStorage.setItem("aifinder-theme", "light");
  }, []);

  // Dark mode is temporarily disabled while AiFinder UI/layout is stabilized.
  // Keep this context shape so the dark-mode UI can be restored later without
  // touching consumers that only need to know the active theme.
  const toggleTheme = useCallback(() => {
    localStorage.setItem("aifinder-theme", "light");
  }, []);

  return (
    <ThemeContext.Provider value={{ isLightMode, toggleTheme }}>
      <div className="theme-light">{children}</div>
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
