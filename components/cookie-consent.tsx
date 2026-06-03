'use client';

import { useState, useEffect } from 'react';
import { setConsent, getConsent, type CookieConsent } from '@/lib/cookies';
import { X, Shield, BarChart3, ChevronDown, ChevronUp, Cookie } from 'lucide-react';

type ConsentMode = 'all' | 'necessary' | 'custom';

declare global {
  interface WindowEventMap {
    'cookie-consent-changed': CustomEvent<CookieConsent>;
  }
}

function dispatchConsentEvent(consent: CookieConsent) {
  window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: consent }));
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analyticsChecked, setAnalyticsChecked] = useState(false);

  useEffect(() => {
    const existing = getConsent();
    if (!existing) {
      setVisible(true);
    }
  }, []);

  const handleAccept = (mode: ConsentMode) => {
    const consent = setConsent({
      necessary: true,
      analytics: mode === 'all' || (mode === 'custom' && analyticsChecked),
    });
    setVisible(false);
    dispatchConsentEvent(consent);
  };

  const handleNecessaryOnly = () => {
    handleAccept('necessary');
  };

  const handleAcceptAll = () => {
    handleAccept('all');
  };

  const handleSaveCustom = () => {
    handleAccept('custom');
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header */}
        <div className="p-5 md:p-6 pb-0">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Cookie className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white mb-1">
                We value your privacy
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                We use cookies to ensure the basic functionality of our website (ticket purchases, 
                user login, shopping cart). With your consent, we also use analytics tools to 
                improve our website. You can adjust your preferences at any time.
              </p>
            </div>
          </div>
        </div>

        {/* Expandable Details */}
        <div className="px-5 md:px-6">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm mt-4 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {expanded ? 'Hide details' : 'Show cookie details'}
          </button>

          {expanded && (
            <div className="mt-4 space-y-3 pb-2">
              {/* Necessary */}
              <div className="flex items-start gap-3 p-3 bg-black/30 rounded-lg border border-white/5">
                <div className="w-8 h-8 bg-red-500/10 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium text-sm">Necessary</span>
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Required</span>
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed">
                    Essential cookies for website functionality: user authentication, 
                    shopping cart session, and security. These cannot be disabled.
                  </p>
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-start gap-3 p-3 bg-black/30 rounded-lg border border-white/5">
                <div className="w-8 h-8 bg-red-500/10 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                  <BarChart3 className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium text-sm">Analytics</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={analyticsChecked}
                        onChange={(e) => setAnalyticsChecked(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed">
                    Helps us understand how visitors interact with our website. 
                    We use Vercel Speed Insights to measure page performance. 
                    All data is anonymized.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-5 md:p-6 pt-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleNecessaryOnly}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg transition-colors text-sm font-medium border border-white/10"
          >
            Necessary Only
          </button>
          <div className="flex-1" />
          {expanded && (
            <button
              onClick={handleSaveCustom}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Save Preferences
            </button>
          )}
          <button
            onClick={handleAcceptAll}
            className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
