import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export function useUrlState(defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse state from current URL
  const state = useMemo(() => {
    const parsed = { ...defaults };
    for (const [key, value] of searchParams.entries()) {
      if (value !== undefined && value !== '') {
        parsed[key] = value;
      }
    }
    // Parse numeric page/limit
    if (parsed.page) parsed.page = parseInt(parsed.page, 10) || 1;
    if (parsed.limit) parsed.limit = parseInt(parsed.limit, 10) || 10;
    return parsed;
  }, [searchParams, defaults]);

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
    setSearchParams(
      new URLSearchParams({
        page: '1',
        limit: String(defaults.limit || 10),
        sortBy: defaults.sortBy || 'createdAt',
        sortOrder: defaults.sortOrder || 'desc',
      }),
      { replace: true }
    );
  }, [defaults, setSearchParams]);

  return {
    state,
    updateState,
    resetFilters,
  };
}
