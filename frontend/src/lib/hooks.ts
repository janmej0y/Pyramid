"use client";

import { useCallback, useEffect, useState } from "react";

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

/**
 * Minimal fetch-on-mount hook with a manual reload trigger.
 *
 * Deliberately not a data-fetching library: the app has a handful of read
 * paths, and this keeps the dependency surface small. Stale responses are
 * discarded so a slow request can't overwrite a newer one.
 */
export function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList,
): AsyncState<T> {
  // One state object, so a settled request is a single transition rather than
  // separate data/loading/error updates.
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });

  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    fetcher()
      .then((result) => {
        if (cancelled) return;
        setState({ data: result, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : "Something went wrong",
        });
      });

    return () => {
      cancelled = true;
    };
    // `fetcher` is intentionally excluded — callers pass an inline closure, and
    // the explicit deps list is the cache key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { ...state, reload };
}

/** Delays a fast-changing value, so typing doesn't fire a request per keystroke. */
export function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
