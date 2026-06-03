'use client';

export type CookieCategory = 'necessary' | 'analytics';

export interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  timestamp: string;
  version: string;
}

const CONSENT_KEY = 'kinker_cookie_consent';
const CONSENT_VERSION = '1.0';

export function getConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    // Validate structure
    if (typeof parsed.necessary !== 'boolean' || typeof parsed.analytics !== 'boolean') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setConsent(consent: Omit<CookieConsent, 'timestamp' | 'version'>): CookieConsent {
  const fullConsent: CookieConsent = {
    ...consent,
    necessary: true, // Always true
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(fullConsent));
  }
  return fullConsent;
}

export function hasConsent(category: CookieCategory): boolean {
  const consent = getConsent();
  if (!consent) return category === 'necessary';
  return consent[category] === true;
}

export function clearConsent(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CONSENT_KEY);
  }
}

export function showCookieBanner(): boolean {
  if (typeof window === 'undefined') return false;
  return getConsent() === null;
}
