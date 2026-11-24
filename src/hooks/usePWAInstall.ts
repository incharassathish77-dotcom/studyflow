import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let cachedPrompt: BeforeInstallPromptEvent | null = null;
let installedFlag = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((cb) => cb());
}

if (typeof window !== 'undefined') {
  installedFlag =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    cachedPrompt = e as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    installedFlag = true;
    cachedPrompt = null;
    notifyListeners();
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => cachedPrompt,
  );
  const [isInstalled, setIsInstalled] = useState(() => installedFlag);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const sync = () => {
      setDeferredPrompt(cachedPrompt);
      setIsInstalled(installedFlag);
    };

    listeners.add(sync);
    sync();

    return () => {
      listeners.delete(sync);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      installedFlag = true;
      cachedPrompt = null;
      notifyListeners();
      return true;
    }
    return false;
  };

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    install,
  };
}
