import { useState, useEffect, useCallback } from 'react';

/**
 * Custom data hook for Pharmacist workspace with loading, error, double-submit guard & refetch capabilities
 */
export function usePharmacistData(fetchFn, deps = [], autoFetch = true) {
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
        setError(err.message || 'Failed to load pharmacy data');
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

export default usePharmacistData;
