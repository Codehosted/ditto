/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cookie, ShieldCheck } from "lucide-react";

const STORAGE_KEY = "ditto_cookie_consent";

type ConsentChoice = "accepted" | "declined";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const choose = (choice: ConsentChoice) => {
    localStorage.setItem(STORAGE_KEY, choice);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="fixed bottom-0 inset-x-0 z-[60] p-4 sm:p-6"
        >
          <div className="max-w-3xl mx-auto bg-stone-900 text-stone-50 rounded-2xl shadow-lg border border-stone-700 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="flex items-start gap-4 flex-1">
              <Cookie size={22} strokeWidth={1.5} className="text-stone-300 shrink-0 mt-0.5" />
              <div>
                <p className="font-serif text-lg mb-1">A note about cookies.</p>
                <p className="text-sm text-stone-300 leading-relaxed font-light">
                  We use cookies to keep you signed in and to understand how the site
                  is used, so we can make Ditto better. Read our{" "}
                  <a href="#" className="underline underline-offset-2 hover:text-stone-50 transition-colors">
                    Privacy Policy
                  </a>{" "}
                  to learn more.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => choose("declined")}
                className="px-5 py-2.5 text-sm font-medium text-stone-300 hover:text-stone-50 border border-stone-600 rounded-full transition-all"
              >
                Decline
              </button>
              <button
                onClick={() => choose("accepted")}
                className="px-5 py-2.5 bg-stone-50 text-stone-900 text-sm font-medium rounded-full hover:bg-white transition-all flex items-center gap-2"
              >
                <ShieldCheck size={16} strokeWidth={1.5} />
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
