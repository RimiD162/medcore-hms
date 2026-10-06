import { useState, useEffect, useCallback } from 'react';

/**
 * Custom data hook for Laboratory workspace with loading, error, and refetch capabilities
 */
export function useLabData(fetchFn, deps = [], autoFetch = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const refetch = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchFn(...args);
        const unwrapped = response?.data !== undefined ? response.data : response;
        setData(unwrapped);
        return unwrapped;
      } catch (err) {
        const errMsg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Failed to load laboratory data';
        setError(errMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchFn]
  );

  useEffect(() => {
    if (autoFetch) {
      refetch();
    }
  }, deps);

  return { data, loading, error, refetch, setData };
}

export default useLabData;
