import { useState, useEffect, useCallback } from 'react';

export function useReceptionistData(fetchFn, deps = [], autoFetch = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const refetch = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchFn(...args);
      setData(response.data || response);
      return response.data || response;
    } catch (err) {
      setError(err.message || 'Failed to load data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (autoFetch) {
      refetch();
    }
  }, deps);

  return { data, loading, error, refetch, setData };
}

export default useReceptionistData;
