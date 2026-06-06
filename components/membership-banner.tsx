'use client';

import { useState, useEffect } from 'react';
import { X, Crown } from 'lucide-react';
import Link from 'next/link';

export function MembershipBanner() {
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimateIn(true);
        });
      });
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setAnimateIn(false);
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
        </div>
      </div>
    </div>
  );
}
