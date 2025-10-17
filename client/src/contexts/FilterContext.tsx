import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface FilterContextState {
  isRibbonVisible: boolean;
  isDockOpen: boolean;
  isLabOpen: boolean;
  activeSection: string | null;
  setRibbonVisible: (visible: boolean) => void;
  setDockOpen: (open: boolean) => void;
  setLabOpen: (open: boolean) => void;
  setActiveSection: (section: string | null) => void;
  toggleDock: () => void;
  toggleLab: () => void;
}

const FilterContext = createContext<FilterContextState | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [isRibbonVisible, setRibbonVisible] = useState(true);
  const [isDockOpen, setDockOpen] = useState(false);
  const [isLabOpen, setLabOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>('viewby');

  const toggleDock = useCallback(() => {
    setDockOpen(prev => !prev);
  }, []);

  const toggleLab = useCallback(() => {
    setLabOpen(prev => !prev);
  }, []);

  return (
    <FilterContext.Provider
      value={{
        isRibbonVisible,
        isDockOpen,
        isLabOpen,
        activeSection,
        setRibbonVisible,
        setDockOpen,
        setLabOpen,
        setActiveSection,
        toggleDock,
        toggleLab,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilterContext() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
}
