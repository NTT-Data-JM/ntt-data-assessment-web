import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { RoleBand } from "../domain/types";
import { hasLeaderQuestions } from "../services/catalogService";
import { getStoredRoleBand, setStoredRoleBand } from "../services/storage";

interface DemoStoreValue {
  roleBand: RoleBand;
  setRoleBand: (band: RoleBand) => void;
  leaderEnabled: boolean;
  revision: number;
  refresh: () => void;
  apiError: string | null;
}

const DemoStoreContext = createContext<DemoStoreValue | null>(null);

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [roleBand, setRoleBandState] = useState<RoleBand>(
    () => getStoredRoleBand() ?? "MID",
  );
  const [revision, setRevision] = useState(0);
  const [leaderEnabled, setLeaderEnabled] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    hasLeaderQuestions()
      .then((enabled) => {
        if (!cancelled) {
          setLeaderEnabled(enabled);
          setApiError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLeaderEnabled(false);
          setApiError(err instanceof Error ? err.message : String(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [revision]);

  const setRoleBand = useCallback(
    (band: RoleBand) => {
      if (band === "LEADER" && !leaderEnabled) return;
      setStoredRoleBand(band);
      setRoleBandState(band);
    },
    [leaderEnabled],
  );

  const refresh = useCallback(() => setRevision((n) => n + 1), []);

  const value = useMemo(
    () => ({ roleBand, setRoleBand, leaderEnabled, revision, refresh, apiError }),
    [roleBand, setRoleBand, leaderEnabled, revision, refresh, apiError],
  );

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore() {
  const ctx = useContext(DemoStoreContext);
  if (!ctx) throw new Error("useDemoStore must be used within DemoStoreProvider");
  return ctx;
}
