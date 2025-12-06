import { useState, useCallback } from 'react';
import api from '@/services/api';

/**
 * Custom hook for API calls with loading and error states
 * Provides a consistent pattern for making API requests
 */
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Execute an API request with automatic loading/error handling
   * @param {Function} apiCall - The API function to execute
   * @param {Object} options - Configuration options
   */
  const execute = useCallback(async (apiCall, options = {}) => {
    const {
      onSuccess,
      onError,
      showLoading = true,
      showError = true,
    } = options;

    try {
      if (showLoading) setLoading(true);
      setError(null);

      const response = await apiCall();
      
      if (onSuccess) {
        onSuccess(response.data);
      }

      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'An error occurred';
      
      if (showError) setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }

      return { success: false, error: errorMessage };
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  /**
   * GET request
   */
  const get = useCallback((url, config = {}) => {
    return execute(() => api.get(url, config));
  }, [execute]);

  /**
   * POST request
   */
  const post = useCallback((url, data, config = {}) => {
    return execute(() => api.post(url, data, config));
  }, [execute]);

  /**
   * PUT request
   */
  const put = useCallback((url, data, config = {}) => {
    return execute(() => api.put(url, data, config));
  }, [execute]);

  /**
   * PATCH request
   */
  const patch = useCallback((url, data, config = {}) => {
    return execute(() => api.patch(url, data, config));
  }, [execute]);

  /**
   * DELETE request
   */
  const del = useCallback((url, config = {}) => {
    return execute(() => api.delete(url, config));
  }, [execute]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset all states
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    get,
    post,
    put,
    patch,
    delete: del,
    clearError,
    reset,
  };
};

/**
 * Custom hook for fetching data from API with automatic refetch
 * @param {Function} apiCall - The API function to execute
 * @param {Object} options - Configuration options
 */
export const useFetch = (apiCall, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    immediate = true,
    onSuccess,
    onError,
  } = options;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiCall();
      setData(response.data);

      if (onSuccess) {
        onSuccess(response.data);
      }

      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'An error occurred';
      
      setError(errorMessage);

      if (onError) {
        onError(errorMessage);
      }

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [apiCall, onSuccess, onError]);

  // Auto-fetch on mount if immediate is true
  useState(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, fetchData]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    reset,
  };
};

/**
 * Custom hook for paginated API calls
 * @param {Function} apiCall - The API function to execute (should accept page and pageSize params)
 * @param {Object} options - Configuration options
 */
export const usePaginatedApi = (apiCall, options = {}) => {
  const {
    initialPage = 1,
    initialPageSize = 10,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchData = useCallback(async (pageNum = page, pageSizeNum = pageSize) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiCall(pageNum, pageSizeNum);
      const { items, total } = response.data;

      setData(items || response.data);
      setTotalCount(total || items?.length || 0);
      setHasMore(items ? items.length === pageSizeNum : false);

      if (onSuccess) {
        onSuccess(response.data);
      }

      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'An error occurred';
      
      setError(errorMessage);

      if (onError) {
        onError(errorMessage);
      }

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [apiCall, page, pageSize, onSuccess, onError]);

  const nextPage = useCallback(() => {
    const newPage = page + 1;
    setPage(newPage);
    fetchData(newPage, pageSize);
  }, [page, pageSize, fetchData]);

  const prevPage = useCallback(() => {
    const newPage = Math.max(1, page - 1);
    setPage(newPage);
    fetchData(newPage, pageSize);
  }, [page, pageSize, fetchData]);

  const goToPage = useCallback((pageNum) => {
    setPage(pageNum);
    fetchData(pageNum, pageSize);
  }, [pageSize, fetchData]);

  const changePageSize = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
    fetchData(1, newPageSize);
  }, [fetchData]);

  const reset = useCallback(() => {
    setData([]);
    setError(null);
    setLoading(false);
    setPage(initialPage);
    setPageSize(initialPageSize);
    setTotalCount(0);
    setHasMore(true);
  }, [initialPage, initialPageSize]);

  return {
    data,
    loading,
    error,
    page,
    pageSize,
    totalCount,
    hasMore,
    fetchData,
    nextPage,
    prevPage,
    goToPage,
    changePageSize,
    reset,
  };
};
