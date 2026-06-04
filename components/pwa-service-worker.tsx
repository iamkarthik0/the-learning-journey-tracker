'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Registers the service worker for PWA support.
 * Only registers in production to avoid dev caching issues.
 *
 * Update flow:
 *  - On every visit, browser fetches /sw.js (no-cache headers ensure freshness)
 *  - If the new SW is byte-different (CACHE_VERSION bumped at build time),
 *    it installs in the background while the old one keeps serving.
 *  - When the new SW finishes installing, we show a toast asking the user
 *    to refresh — non-disruptive and user-controlled.
 */
export function PwaServiceWorker() {
  const refreshingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // Skip SW in dev to avoid caching local builds
    if (process.env.NODE_ENV !== 'production') return;

    const promptUpdate = (worker: ServiceWorker) => {
      toast.message('Update available', {
        description: 'A new version of LJ Tracker is ready.',
        duration: Infinity,
        action: {
          label: 'Refresh',
          onClick: () => {
            worker.postMessage({ type: 'SKIP_WAITING' });
          },
        },
        cancel: {
          label: 'Later',
          onClick: () => {
            // do nothing — user will get the update on next reload
          },
        },
      });
    };

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        // If there's already a waiting worker (user dismissed before), prompt now
        if (registration.waiting && navigator.serviceWorker.controller) {
          promptUpdate(registration.waiting);
        }

        // Watch for new workers being installed
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // First-time install (no controller yet) → silent.
              // Update install (controller exists) → prompt user.
              promptUpdate(newWorker);
            }
          });
        });

        // When the new SW takes control, reload once to apply it
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshingRef.current) return;
          refreshingRef.current = true;
          window.location.reload();
        });

        // Periodically check for updates while the app is open (every 60 min)
        const interval = window.setInterval(
          () => {
            registration.update().catch(() => {
              /* ignore — network may be offline */
            });
          },
          60 * 60 * 1000
        );

        // Also check when the tab becomes visible again
        const onVisibility = () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {});
          }
        };
        document.addEventListener('visibilitychange', onVisibility);

        // Cleanup function returned to React effect
        return () => {
          window.clearInterval(interval);
          document.removeEventListener('visibilitychange', onVisibility);
        };
      } catch (err) {
        console.warn('[PWA] Service worker registration failed:', err);
      }
    };

    let cleanup: (() => void) | undefined;

    // Defer registration to idle time so it doesn't compete with first paint
    const idle = (cb: () => void) => {
      if ('requestIdleCallback' in window) {
        // @ts-expect-error - requestIdleCallback typing not always present
        return window.requestIdleCallback(cb, { timeout: 4000 });
      }
      return window.setTimeout(cb, 2000);
    };

    idle(() => {
      register().then((c) => {
        cleanup = c;
      });
    });

    return () => {
      cleanup?.();
    };
  }, []);

  return null;
}
