/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, X } from "lucide-react";

interface PrivacyPolicyProps {
  open: boolean;
  onClose: () => void;
}

export default function PrivacyPolicy({ open, onClose }: PrivacyPolicyProps) {
  // Close on Escape for keyboard users
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Privacy Policy"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[70] overflow-y-auto bg-stone-900/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <div className="min-h-full flex items-start justify-center p-4 sm:p-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="relative w-full max-w-2xl my-8 bg-white rounded-3xl shadow-2xl border border-stone-200 p-8 sm:p-12"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onClose}
                aria-label="Close privacy policy"
                className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors"
              >
                <X size={20} strokeWidth={1.5} />
              </button>

              <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 mb-8">
                <Shield size={24} strokeWidth={1.5} />
              </div>

              <h2 className="font-serif text-3xl text-stone-900 tracking-tight mb-3">Privacy Policy</h2>
              <p className="text-xs text-stone-400 font-medium uppercase tracking-widest mb-10">
                Last updated September 2026
              </p>

              <div className="space-y-8 text-stone-600 font-light leading-relaxed text-[15px]">
                <section>
                  <h3 className="font-serif text-xl text-stone-900 mb-3">Our promise</h3>
                  <p>
                    Ditto helps families navigate the logistics of loss, which means you
                    entrust us with some of the most sensitive information you own. We treat
                    that responsibility seriously: your family&rsquo;s data remains exactly
                    that&mdash;yours. We do not sell personal data, ever.
                  </p>
                </section>

                <section>
                  <h3 className="font-serif text-xl text-stone-900 mb-3">Cookies we use</h3>
                  <p className="mb-4">
                    Cookies (and similar browser storage) let us keep you signed in and
                    understand how the site is used so we can make Ditto better. Specifically:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0" />
                      <span>
                        <strong className="font-medium text-stone-900">Essential cookies.</strong> Firebase
                        Authentication sets cookies that maintain your session and keep you signed
                        in. These cannot be disabled without breaking sign-in.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0" />
                      <span>
                        <strong className="font-medium text-stone-900">Preference storage.</strong> We
                        store your cookie choice (and, in development builds, sample planning
                        data) in your browser&rsquo;s local storage. It never leaves your device
                        unless you explicitly share it.
                      </span>
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-serif text-xl text-stone-900 mb-3">Your choices</h3>
                  <p className="mb-4">
                    You can decline non-essential cookies in the consent banner and change your
                    mind at any time by clearing your browser storage for this site, which
                    removes your recorded choice and brings the banner back.
                  </p>
                  <p>
                    Most browsers also let you block or delete cookies outright in their privacy
                    settings. If you do, Ditto will still work&mdash;your preference simply
                    won&rsquo;t be remembered between visits, and features that depend on
                    sign-in will ask you to sign in again.
                  </p>
                </section>

                <section>
                  <h3 className="font-serif text-xl text-stone-900 mb-3">Data we handle</h3>
                  <p className="mb-4">
                    Account details you provide during onboarding (names, contact information,
                    documents you upload) are stored under your family&rsquo;s private space and
                    shared only with the family members and collaborators you invite. Guest
                    sessions are anonymous&mdash;we only keep a random identifier so your work
                    isn&rsquo;t lost while you browse.
                  </p>
                  <p>
                    For full details of how we protect documents, sharing controls, and your
                    rights over your information, reach out any time.
                  </p>
                </section>

                <section>
                  <h3 className="font-serif text-xl text-stone-900 mb-3">Contact us</h3>
                  <p>
                    Questions about this policy or how your data is handled? Use the
                    &ldquo;Contact Us&rdquo; link in the site footer, or the AI assistant inside
                    the app, and we&rsquo;ll respond.
                  </p>
                </section>
              </div>

              <button
                onClick={onClose}
                className="mt-10 px-8 py-3 bg-stone-900 text-stone-50 rounded-full text-sm font-medium hover:bg-stone-800 transition-all"
              >
                Back to Ditto
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
