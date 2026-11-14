"use client";
import { useCallback, useEffect, useState } from "react";

export function useApi(fetcher, deps = []) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ data: undefined, error: null, loading: true });

  const retry = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    setAttempt((a) => a + 1);
  }, []);

  const mutate = useCallback((nextData) => {
    setState((s) => ({
      ...s,
      data: typeof nextData === "function" ? nextData(s.data) : nextData,
    }));
  }, []);

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve()
      .then(() => fetcher())
      .then(
        (data) => {
          if (alive) setState({ data, error: null, loading: false });
        },
        (error) => {
          if (alive) setState((s) => ({ data: s.data, error, loading: false }));
        }
      );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, ...deps]);

  return { ...state, retry, mutate };
}

export function errorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error.detail) {
    if (typeof error.detail === "string") return error.detail;
    if (Array.isArray(error.detail)) return error.detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
  }
  return fallback;
}
