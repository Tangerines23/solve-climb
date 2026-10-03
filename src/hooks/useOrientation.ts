import { useState, useEffect } from 'react';

function getIsLandscape(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  if (screen?.orientation?.type) {
    return screen.orientation.type.includes('landscape');
  }
  if (window.matchMedia) {
    return window.matchMedia('(orientation: landscape)').matches;
  }
  return window.innerWidth > window.innerHeight;
}

export function useOrientation(): { isLandscape: boolean } {
  const [isLandscape, setIsLandscape] = useState<boolean>(getIsLandscape);

  useEffect(() => {
    const handleOrientationChange = () => {
      setIsLandscape(getIsLandscape());
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    if (screen?.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange);
    }

    let mediaQuery: MediaQueryList | null = null;
    if (window.matchMedia) {
      mediaQuery = window.matchMedia('(orientation: landscape)');
      mediaQuery.addEventListener('change', handleOrientationChange);
    }

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (screen?.orientation) {
        screen.orientation.removeEventListener('change', handleOrientationChange);
      }
      if (mediaQuery) {
        mediaQuery.removeEventListener('change', handleOrientationChange);
      }
    };
  }, []);

  return { isLandscape };
}
