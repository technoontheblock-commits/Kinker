'use client';

import { useState } from 'react';
import { getConsent, setConsent, hasConsent, type CookieConsent } from '@/lib/cookies';
import { Cookie, X, Shield, BarChart3 } from 'lucide-react';

export function CookieSettingsButton() {
  const [showModal, setShowModal] = useState(false);
  const [analyticsChecked, setAnalyticsChecked] = useState(() => hasConsent('analytics'));

  const handleSave = () => {
    const consent = setConsent({
      necessary: true,
      analytics: analyticsChecked,
    });
    setShowModal(false);
    window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: consent }));
  };

  return (
    <>
      <button
        onClick={() => {
          setAnalyticsChecked(hasConsent('analytics'));
          setShowModal(true);
        }}
        className="text-white/40 hover:text-white transition-colors text-sm inline-flex items-center gap-1.5"
      >
        <Cookie className="w-3.5 h-3.5" />
        Cookie Settings
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <Cookie className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-white">Cookie Settings</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/40 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <p className="text-white/60 text-sm">
                Manage your cookie preferences below. Necessary cookies are always active 
                as they are required for the website to function properly.
              </p>

              {/* Necessary */}
              <div className="flex items-start gap-3 p-4 bg-black/30 rounded-xl border border-white/5">
                <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium text-sm">Necessary</span>
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Always On</span>
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed">
                    Essential for authentication, shopping cart, and security.
                  </p>
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-start gap-3 p-4 bg-black/30 rounded-xl border border-white/5">
                <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
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
                    Vercel Speed Insights for performance measurement. Data is anonymized.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-white/10">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-white/60 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
