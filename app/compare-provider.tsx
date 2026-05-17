"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type CompareContextType = {
  compareSlugs: string[];
  toggleCompare: (slug: string) => void;
  clearCompare: () => void;
};

const CompareContext =
  createContext<CompareContextType | null>(null);

export function CompareProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [compareSlugs, setCompareSlugs] = useState<string[]>(
    []
  );

  useEffect(() => {
    const savedCompare = localStorage.getItem(
      "aifinder-compare"
    );

    if (savedCompare) {
      setCompareSlugs(JSON.parse(savedCompare));
    }
  }, []);

  const saveCompare = (items: string[]) => {
    setCompareSlugs(items);

    localStorage.setItem(
      "aifinder-compare",
      JSON.stringify(items)
    );
  };

  const toggleCompare = (slug: string) => {
    if (compareSlugs.includes(slug)) {
      saveCompare(
        compareSlugs.filter((item) => item !== slug)
      );
      return;
    }

    if (compareSlugs.length >= 3) return;

    saveCompare([...compareSlugs, slug]);
  };

  const clearCompare = () => {
    saveCompare([]);
  };

  return (
    <CompareContext.Provider
      value={{
        compareSlugs,
        toggleCompare,
        clearCompare,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);

  if (!context) {
    throw new Error(
      "useCompare must be used inside CompareProvider"
    );
  }

  return context;
}