import { useState, useEffect, useCallback } from 'react';
import accountantApi from '../api/accountantApi';

/**
 * Custom hook for fetching and managing Accountant Workspace dashboard KPIs
 */
export function useAccountantDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await accountantApi.getDashboard();
      setData(res.data || res);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Custom hook for fetching system billing configuration
 */
export function useBillingConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    accountantApi
      .getConfig()
      .then((res) => {
        if (mounted) setConfig(res.data || res);
      })
      .catch((err) => {
        console.error('Failed to load billing config:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { config, loading };
}

export default {
  useAccountantDashboard,
  useBillingConfig,
};
