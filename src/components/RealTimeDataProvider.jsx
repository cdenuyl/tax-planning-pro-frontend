import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * Real-Time Data Provider
 * Provides live updates and data synchronization across components
 */

const RealTimeDataContext = createContext();

export const useRealTimeData = () => {
  const context = useContext(RealTimeDataContext);
  if (!context) {
    throw new Error('useRealTimeData must be used within a RealTimeDataProvider');
  }
  return context;
};

export const RealTimeDataProvider = ({ children }) => {
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [subscribers, setSubscribers] = useState(new Map());
  const [dataCache, setDataCache] = useState(new Map());
  const [isUpdating, setIsUpdating] = useState(false);

  // Force update all subscribers
  const triggerUpdate = useCallback((reason = 'manual') => {
    setUpdateTrigger(prev => prev + 1);
    setIsUpdating(true);
    
    // Notify all subscribers
    subscribers.forEach((callback, id) => {
      try {
        callback({ reason, timestamp: Date.now() });
      } catch (error) {
        console.warn(`Error notifying subscriber ${id}:`, error);
      }
    });
    
    // Reset updating state after a brief delay
    setTimeout(() => setIsUpdating(false), 100);
  }, [subscribers]);

  // Subscribe to real-time updates
  const subscribe = useCallback((id, callback) => {
    setSubscribers(prev => new Map(prev.set(id, callback)));
    
    // Return unsubscribe function
    return () => {
      setSubscribers(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
    };
  }, []);

  // Cache data with automatic invalidation
  const cacheData = useCallback((key, data, ttl = 5000) => {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl
    };
    
    setDataCache(prev => new Map(prev.set(key, cacheEntry)));
    
    // Auto-invalidate after TTL
    setTimeout(() => {
      setDataCache(prev => {
        const newMap = new Map(prev);
        const entry = newMap.get(key);
        if (entry && entry.timestamp === cacheEntry.timestamp) {
          newMap.delete(key);
        }
        return newMap;
      });
    }, ttl);
  }, []);

  // Get cached data
  const getCachedData = useCallback((key) => {
    const entry = dataCache.get(key);
    if (!entry) return null;
    
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      setDataCache(prev => {
        const newMap = new Map(prev);
        newMap.delete(key);
        return newMap;
      });
      return null;
    }
    
    return entry.data;
  }, [dataCache]);

  // Debounced update function
  const [updateTimeout, setUpdateTimeout] = useState(null);
  
  const debouncedUpdate = useCallback((reason = 'debounced', delay = 300) => {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    
    const timeout = setTimeout(() => {
      triggerUpdate(reason);
      setUpdateTimeout(null);
    }, delay);
    
    setUpdateTimeout(timeout);
  }, [updateTimeout, triggerUpdate]);

  // Auto-update on data changes
  useEffect(() => {
    const interval = setInterval(() => {
      // Check if any cached data needs refresh
      const now = Date.now();
      let needsUpdate = false;
      
      dataCache.forEach((entry, key) => {
        if (now - entry.timestamp > entry.ttl * 0.8) { // Refresh at 80% of TTL
          needsUpdate = true;
        }
      });
      
      if (needsUpdate) {
        debouncedUpdate('auto-refresh');
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [dataCache, debouncedUpdate]);

  // Performance monitoring
  const [performanceMetrics, setPerformanceMetrics] = useState({
    updateCount: 0,
    averageUpdateTime: 0,
    lastUpdateTime: 0
  });

  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const updateTime = endTime - startTime;
      
      setPerformanceMetrics(prev => ({
        updateCount: prev.updateCount + 1,
        averageUpdateTime: (prev.averageUpdateTime * prev.updateCount + updateTime) / (prev.updateCount + 1),
        lastUpdateTime: updateTime
      }));
    };
  }, [updateTrigger]);

  const contextValue = {
    // Update triggers
    updateTrigger,
    triggerUpdate,
    debouncedUpdate,
    isUpdating,
    
    // Subscription management
    subscribe,
    subscriberCount: subscribers.size,
    
    // Data caching
    cacheData,
    getCachedData,
    cacheSize: dataCache.size,
    
    // Performance metrics
    performanceMetrics,
    
    // Utility functions
    clearCache: () => setDataCache(new Map()),
    getSubscribers: () => Array.from(subscribers.keys())
  };

  return (
    <RealTimeDataContext.Provider value={contextValue}>
      {children}
    </RealTimeDataContext.Provider>
  );
};

/**
 * Hook for components that need real-time updates
 */
export const useRealTimeUpdates = (componentId, onUpdate) => {
  const { subscribe, triggerUpdate, isUpdating } = useRealTimeData();
  
  useEffect(() => {
    if (!componentId || !onUpdate) return;
    
    const unsubscribe = subscribe(componentId, onUpdate);
    return unsubscribe;
  }, [componentId, onUpdate, subscribe]);
  
  return {
    triggerUpdate,
    isUpdating
  };
};

/**
 * Hook for caching expensive calculations
 */
export const useDataCache = (key, calculator, dependencies = [], ttl = 5000) => {
  const { cacheData, getCachedData } = useRealTimeData();
  const [data, setData] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  useEffect(() => {
    const cachedData = getCachedData(key);
    if (cachedData) {
      setData(cachedData);
      return;
    }
    
    if (typeof calculator === 'function') {
      setIsCalculating(true);
      
      try {
        const result = calculator();
        setData(result);
        cacheData(key, result, ttl);
      } catch (error) {
        console.error(`Error calculating data for key ${key}:`, error);
      } finally {
        setIsCalculating(false);
      }
    }
  }, [key, calculator, getCachedData, cacheData, ttl, ...dependencies]);
  
  return {
    data,
    isCalculating,
    refresh: () => {
      setData(null);
      // This will trigger the useEffect to recalculate
    }
  };
};

export default RealTimeDataProvider;

