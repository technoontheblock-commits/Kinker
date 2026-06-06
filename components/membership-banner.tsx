'use client';

import { useState, useEffect } from 'react';
import { X, Crown } from 'lucide-react';
import Link from 'next/link';

const STORAGE_KEY = 'membership-banner-dismissed';

export function MembershipBanner() {
  const [visible, setVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const dismissed = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (dismissed === 'true') return;

    const timer = setTimeout(() => {
      setVisible(true);
      // Trigger animation on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimateIn(true);
        });
      });
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    if (dontShowAgain && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setAnimateIn(false);
    // Wait for animation to finish before unmounting
    setTimeout(() => setVisible(false), 500);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 max-w-sm w-[calc(100%-2rem)] sm:w-auto transition-all duration-500 ease-out ${
        animateIn ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white mb-1">
                Werde KINKER Member
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Exklusive Vorteile, Early Access zu Events und mehr. Hol dir jetzt deine Membership!
              </p>
              <div className="mt-3">
                <Link
                  href="/membership"
                  onClick={handleDismiss}
                  className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Jetzt Mitglied werden
                </Link>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 text-white/40 hover:text-white transition-colors flex-shrink-0 -mr-1 -mt-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-red-500 focus:ring-red-500/50 focus:ring-1"
              />
              <span className="text-white/40 group-hover:text-white/60 text-xs transition-colors">
                Don&apos;t show again
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
