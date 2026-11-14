import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { getDbVersion, subscribeDb } from "@/data/admin/db";

export function useDbVersion() {
  return useSyncExternalStore(subscribeDb, getDbVersion, getDbVersion);
}

interface ApiState<T> {
  data: T | undefined;
  error: Error | null;
  loading: boolean;
}

/**
 * Calls an API-shaped function and re-runs it whenever shared admin data changes,
 * keeping the previous data on screen while refreshing.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const version = useDbVersion();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<ApiState<T>>({ data: undefined, error: null, loading: true });

  useEffect(() => {
    let alive = true;
    fetcher().then(
      (data) => alive && setState({ data, error: null, loading: false }),
      (error: Error) => alive && setState((s) => ({ data: s.data, error, loading: false })),
    );
    return () => {
      alive = false;
    };
    // The fetcher identity changes each render; deps describe what it depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, attempt, ...deps]);

  const retry = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    setAttempt((a) => a + 1);
  }, []);

  return { ...state, retry };
}

/** Error message from an API error or unknown throw. */
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  return error instanceof Error && error.message ? error.message : fallback;
}
