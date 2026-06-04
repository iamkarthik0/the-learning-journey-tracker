'use client';

import { useEffect, useState } from 'react';
import { Download, Share2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Chrome/Edge install prompt event
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISSED_KEY = 'ljt-pwa-install-dismissed';
const DISMISS_DAYS = 7; // re-show after a week if dismissed

function wasRecentlyDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const ts = localStorage.getItem(DISMISSED_KEY);
    if (!ts) return false;
    const dismissedAt = Number(ts);
    if (!Number.isFinite(dismissedAt)) return false;
    const ageMs = Date.now() - dismissedAt;
    return ageMs < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function markDismissed() {
  try {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Detect standalone (already installed)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // Safari iOS
      // @ts-expect-error - non-standard but real
      window.navigator.standalone === true;
    setIsStandalone(standalone);

    // Detect iOS (which doesn't fire beforeinstallprompt)
    const iOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      // @ts-expect-error - MSStream is non-standard
      !window.MSStream;
    setIsIOS(iOS);

    // Don't surface anything if already installed
    if (standalone) return;

    // For iOS, show the manual install hint button (unless dismissed)
    if (iOS && !wasRecentlyDismissed()) {
      setShowButton(true);
    }

    // For Chrome/Edge/Android: capture the install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      if (!wasRecentlyDismissed()) {
        setShowButton(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Hide button once installed
    const installedHandler = () => {
      setShowButton(false);
      setInstallEvent(null);
      setIsStandalone(true);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installEvent) {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === 'dismissed') markDismissed();
      setInstallEvent(null);
      setShowButton(false);
      return;
    }
    // iOS: show manual instructions
    if (isIOS) {
      setShowIosHelp(true);
    }
  };

  const handleDismiss = () => {
    markDismissed();
    setShowButton(false);
  };

  if (isStandalone || !showButton) {
    // iOS help dialog can still be open standalone? no — guard above.
    return null;
  }

  return (
    <>
      {/* Floating install pill — bottom-right on desktop, full width sheet on mobile */}
      <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm pointer-events-none">
        <div className="pointer-events-auto rounded-xl border bg-background/95 backdrop-blur-md shadow-lg p-3 sm:p-4 flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/10 p-2 shrink-0">
            <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">Install LJ Tracker</p>
            <p className="text-xs text-muted-foreground truncate">
              {isIOS && !installEvent
                ? 'Add to your Home Screen'
                : 'Get the app experience'}
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleInstallClick}
            className="shrink-0"
          >
            Install
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDismiss}
            className="h-8 w-8 shrink-0"
            aria-label="Dismiss install prompt"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* iOS instructions dialog */}
      <Dialog open={showIosHelp} onOpenChange={setShowIosHelp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-500" />
              Install on iOS
            </DialogTitle>
            <DialogDescription>
              Follow these steps to add LJ Tracker to your Home Screen.
            </DialogDescription>
          </DialogHeader>

          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                1
              </span>
              <span className="flex-1 flex items-center gap-2">
                Tap the Share button{' '}
                <Share2 className="inline h-4 w-4 text-blue-500" /> in Safari's
                toolbar.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                2
              </span>
              <span className="flex-1 flex items-center gap-2">
                Choose <strong>Add to Home Screen</strong>{' '}
                <Plus className="inline h-4 w-4 text-blue-500" />.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                3
              </span>
              <span className="flex-1">
                Tap <strong>Add</strong> to finish. The app will appear on your
                home screen.
              </span>
            </li>
          </ol>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                markDismissed();
                setShowIosHelp(false);
                setShowButton(false);
              }}
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
