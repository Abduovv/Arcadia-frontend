import { useCallback, useEffect, useState } from "react";
import {
  type DataMode,
  getStoredDataMode,
  setStoredDataMode,
  DATA_MODE_STORAGE_KEY,
} from "@/lib/dataMode";

export function useDataMode() {
  const [mode, setModeState] = useState<DataMode>(() => getStoredDataMode());

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === DATA_MODE_STORAGE_KEY) setModeState(getStoredDataMode());
    };
    const onModeChange = (event: Event) => {
      setModeState((event as CustomEvent<DataMode>).detail);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("arcadia:data-mode-change", onModeChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("arcadia:data-mode-change", onModeChange);
    };
  }, []);

  const setMode = useCallback((nextMode: DataMode) => {
    setStoredDataMode(nextMode);
    setModeState(nextMode);
  }, []);

  return { mode, setMode, isMock: mode === "mock", isReal: mode === "real" };
}
