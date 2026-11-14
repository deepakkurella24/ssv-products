"use client";
import { createContext, useContext, useEffect, useState } from "react";
const ShellContext = createContext({ immersive: false, setImmersive: () => {
} });
export function ShellProvider({ children }) {
  const [immersive, setImmersive] = useState(false);
  return <ShellContext.Provider value={{ immersive, setImmersive }}>{children}</ShellContext.Provider>;
}
export const useShell = () => useContext(ShellContext);
export function useImmersive(active = true) {
  const { setImmersive } = useShell();
  useEffect(() => {
    if (!active) return;
    setImmersive(true);
    return () => setImmersive(false);
  }, [active, setImmersive]);
}
