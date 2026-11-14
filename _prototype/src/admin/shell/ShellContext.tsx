import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface ShellValue {
  /** Full-screen page on mobile: hides the bottom tab bar. */
  immersive: boolean;
  setImmersive: (value: boolean) => void;
}

const ShellContext = createContext<ShellValue>({ immersive: false, setImmersive: () => {} });

export function ShellProvider({ children }: { children: ReactNode }) {
  const [immersive, setImmersive] = useState(false);
  return (
    <ShellContext.Provider value={{ immersive, setImmersive }}>{children}</ShellContext.Provider>
  );
}

export const useShell = () => useContext(ShellContext);

/** Marks the current screen as full-screen on mobile while mounted. */
export function useImmersive(active = true) {
  const { setImmersive } = useShell();
  useEffect(() => {
    if (!active) return;
    setImmersive(true);
    return () => setImmersive(false);
  }, [active, setImmersive]);
}
