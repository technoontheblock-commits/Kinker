'use client';

import { SpeedInsights } from '@vercel/speed-insights/next';
import { hasConsent } from '@/lib/cookies';
import { useEffect, useState } from 'react';

export function AnalyticsWrapper() {
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);

  useEffect(() => {
    setAnalyticsAllowed(hasConsent('analytics'));

    const handleConsentChange = () => {
      setAnalyticsAllowed(hasConsent('analytics'));
    };

    window.addEventListener('cookie-consent-changed', handleConsentChange);
    return () => {
      window.removeEventListener('cookie-consent-changed', handleConsentChange);
    };
  }, []);

  if (!analyticsAllowed) return null;

  return <SpeedInsights />;
}
