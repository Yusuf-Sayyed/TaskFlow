import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo, useRef } from 'react';

export function useUrlState(defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultsRef = useRef(defaults);

  // Parse state from current URL
  const state = useMemo(() => {
    const parsed = { ...defaultsRef.current };
    for (const [key, value] of searchParams.entries()) {
      if (value !== undefined && value !== '') {
        parsed[key] = value;
      }
    }
    // Parse numeric page/limit
    if (parsed.page) parsed.page = parseInt(parsed.page, 10) || 1;
    if (parsed.limit) parsed.limit = parseInt(parsed.limit, 10) || 10;
    return parsed;
  }, [searchParams]);

  // Update URL parameters
  const updateState = useCallback(
    (updates, resetPage = false) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(updates).forEach(([key, val]) => {
            if (val === undefined || val === null || val === '') {
              next.delete(key);
            } else {
              next.set(key, String(val));
            }
          });

          if (resetPage) {
            next.set('page', '1');
          }

          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const resetFilters = useCallback(() => {
    const def = defaultsRef.current;
    setSearchParams(
      new URLSearchParams({
        page: '1',
        limit: String(def.limit || 10),
        sortBy: def.sortBy || 'createdAt',
        sortOrder: def.sortOrder || 'desc',
      }),
      { replace: true }
    );
  }, [setSearchParams]);

  return {
    state,
    updateState,
    resetFilters,
  };
}
