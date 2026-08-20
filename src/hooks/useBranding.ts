import { useState, useEffect, useCallback, useRef } from 'react';
import { AppBrandingConfig, DEFAULT_BRANDING } from '../types';
import { subscribeBranding, saveBrandingToFirestore, fetchBrandingFromFirestore } from '../services/firebase';

const LOCAL_STORAGE_KEY = 'aktara_app_branding';

/**
 * Helper to get initial branding state synchronously from localStorage cache
 */
function getInitialBranding(): AppBrandingConfig {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...DEFAULT_BRANDING, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to parse cached branding from localStorage:', err);
  }
  return DEFAULT_BRANDING;
}

/**
 * Custom React Hook: useBranding
 * 
 * Provides real-time synchronized branding (Logo, Banner URL/Headline, Organization Title)
 * backed by Cloud Firestore at `settings/branding`.
 * 
 * Features:
 * - Instant offline / initial render from local cache
 * - Real-time listener (`onSnapshot`) syncing changes across all devices & tabs
 * - Automatic fallback to DEFAULT_BRANDING if Firestore document is absent
 * - Durable persistence methods (`updateBranding`, `resetBranding`)
 */
export function useBranding() {
  const [branding, setBranding] = useState<AppBrandingConfig>(getInitialBranding);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const isMounted = useRef<boolean>(true);

  // Subscribe to real-time Firestore updates on mount
  useEffect(() => {
    isMounted.current = true;

    // 1. One-time initial fetch for fast confirmation
    fetchBrandingFromFirestore().then((initialData) => {
      if (isMounted.current && initialData) {
        setBranding((prev) => ({ ...prev, ...initialData }));
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialData));
        } catch {
          // ignore quota error
        }
      }
      if (isMounted.current) {
        setIsLoading(false);
      }
    }).catch(() => {
      if (isMounted.current) setIsLoading(false);
    });

    // 2. Real-time subscription to `settings/branding`
    const unsubscribe = subscribeBranding(
      (updatedBranding) => {
        if (isMounted.current) {
          const merged = { ...DEFAULT_BRANDING, ...updatedBranding };
          setBranding(merged);
          setIsLoading(false);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
          } catch {
            // ignore localStorage quota errors
          }
        }
      },
      (err) => {
        console.warn('useBranding listener error:', err);
        if (isMounted.current) setIsLoading(false);
      }
    );

    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, []);

  /**
   * Update branding configuration and persist permanently to Firestore `settings/branding`
   */
  const updateBranding = useCallback(async (newBranding: AppBrandingConfig): Promise<void> => {
    setIsSaving(true);
    const sanitized: AppBrandingConfig = {
      ...DEFAULT_BRANDING,
      ...newBranding,
      updatedAt: new Date().toISOString()
    };

    // Optimistic local update
    setBranding(sanitized);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sanitized));
    } catch {
      // ignore
    }

    try {
      await saveBrandingToFirestore(sanitized);
      if (isMounted.current) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Failed to persist branding to Firestore settings/branding:', error);
      throw error;
    } finally {
      if (isMounted.current) {
        setIsSaving(false);
      }
    }
  }, []);

  /**
   * Reset branding configuration back to factory default
   */
  const resetBranding = useCallback(async (): Promise<void> => {
    setIsSaving(true);
    const defaultData: AppBrandingConfig = {
      ...DEFAULT_BRANDING,
      updatedAt: new Date().toISOString()
    };

    setBranding(defaultData);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // ignore
    }

    try {
      await saveBrandingToFirestore(defaultData);
      if (isMounted.current) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Failed to reset branding in Firestore:', error);
      throw error;
    } finally {
      if (isMounted.current) {
        setIsSaving(false);
      }
    }
  }, []);

  return {
    branding,
    isLoading,
    isSaving,
    lastSaved,
    updateBranding,
    resetBranding
  };
}
