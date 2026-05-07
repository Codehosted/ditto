/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, FileText, CheckCircle2, Users, Heart } from "lucide-react";
import Onboarding from "./components/Onboarding";
import Dashboard from "./components/Dashboard";
import FuneralHomePortal from "./components/FuneralHomePortal";
import Subscription from "./components/Subscription";
import AIChat from "./components/AIChat";
import FAQ from "./components/FAQ";
import SmartSearch from "./components/SmartSearch";
import DevToolbar from "./components/DevToolbar";
import { FirebaseProvider, ErrorBoundary, useFirebase } from "./components/FirebaseProvider";

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
  >
    {children}
  </motion.div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <AppContent />
        <DevToolbar />
      </FirebaseProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const [view, setView] = useState<"landing" | "onboarding" | "dashboard" | "vendor-portal">("landing");
  const { user, profile, loading, familyData, signInWithGoogle, signInAsGuest, signOutUser } = useFirebase();

  useEffect(() => {
    if (user && profile?.role === "vendor" && view !== "vendor-portal") {
      setView("vendor-portal");
    } else if (user && familyData && view === "landing") {
      setView("dashboard");
    }
  }, [user, profile, familyData, view]);

  const handleStart = () => setView("onboarding");
  const handleExitOnboarding = () => setView("landing");
  const handleCompleteOnboarding = () => setView("dashboard");
  const handleVendorPortal = () => setView("vendor-portal");

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.warn("Google sign-in failed, continuing as guest.", error);
      await signInAsGuest();
    }
    setView("dashboard");
  };

  const handleLogout = async () => {
    await signOutUser();
    setView("landing");
  };

  if (view === "vendor-portal") {
    return (
      <>
        <FuneralHomePortal />
        <AIChat />
      </>
    );
  }

  if (view === "onboarding") {
    return (
      <>
        <Onboarding 
          onComplete={handleCompleteOnboarding} 
          onExit={handleExitOnboarding} 
          onLogin={handleLogin}
        />
        <AIChat />
      </>
    );
  }

  if (view === "dashboard") {
    return (
      <>
        <Dashboard onLogoClick={() => setView("landing")} />
        <AIChat />
      </>
    );
  }

  return (
    <div className="min-h-screen selection:bg-stone-200">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-stone-50/80 backdrop-blur-sm border-b border-stone-200/50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <button 
            onClick={() => setView("landing")}
            className="font-serif text-2xl tracking-tight text-stone-900 hover:opacity-70 transition-opacity"
          >
            Ditto
          </button>
          <div className="flex gap-8 text-sm font-medium text-stone-600 items-center">
            <a href="#how-it-works" className="hover:text-stone-900 transition-colors">How it works</a>
            <a href="#faq" className="hover:text-stone-900 transition-colors">FAQ</a>
            <a href="#pricing" className="hover:text-stone-900 transition-colors">Pricing</a>
            <button 
              onClick={handleVendorPortal}
              className="text-stone-900 hover:opacity-70 transition-opacity"
            >
              Vendor Login
            </button>
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-stone-100 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setView("dashboard")}
                  className="text-stone-900 font-semibold"
                >
                  Dashboard
                </button>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 border border-stone-200 rounded-full hover:bg-stone-50 transition-all"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="px-6 py-2 bg-stone-900 text-stone-50 rounded-full hover:bg-stone-800 transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="pt-48 pb-32 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <FadeIn>
              <h1 className="text-5xl md:text-6xl mb-8 leading-[1.1]">
                A quiet place for <br />
                <span className="italic">difficult days.</span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="text-lg md:text-xl text-stone-600 leading-relaxed max-w-2xl mx-auto mb-12 font-light">
                Your family concentrates on healing, we take care of the homegoing. 
                Ditto helps families navigate the logistics of loss with dignity, 
                keeping everything you need in one secure, shared space.
              </p>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div className="mb-12">
                <SmartSearch />
              </div>
            </FadeIn>
            <FadeIn delay={0.4}>
              <button 
                onClick={handleStart}
                className="px-8 py-4 bg-stone-900 text-stone-50 rounded-full text-sm font-medium hover:bg-stone-800 transition-all shadow-sm"
              >
                Begin when you’re ready
              </button>
            </FadeIn>
          </div>
        </section>

        {/* The Problem - Text Only */}
        <section className="py-32 bg-stone-100">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <FadeIn>
              <h2 className="text-4xl mb-8 leading-tight">
                The weight of logistics <br />
                shouldn’t fall on grief.
              </h2>
              <p className="text-stone-600 leading-relaxed mb-8 font-light text-lg">
                When a loved one passes, families are often met with an overwhelming 
                list of tasks, documents, and decisions. In a time that calls for 
                reflection and connection, the administrative burden can feel insurmountable.
              </p>
              <p className="text-stone-600 leading-relaxed font-light text-lg">
                We created Ditto to carry that weight for you, providing a structured 
                path forward so you can focus on what truly matters.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* Mantra Section */}
        <section className="py-32 bg-white">
          <div className="max-w-4xl mx-auto px-6">
            <FadeIn>
              <div className="bg-stone-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                  <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-stone-400 blur-[100px]" />
                  <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-stone-400 blur-[100px]" />
                </div>
                <h3 className="text-stone-400 text-xs font-medium uppercase tracking-[0.3em] mb-8">Our Mantra</h3>
                <blockquote className="text-3xl md:text-4xl lg:text-5xl font-serif text-stone-50 leading-tight mb-10">
                  “Ditto is the carbon copy of you. Instead of handling these times alone, we will travel the road together. In some cases, Ditto will even take over the process for you. Our goal is to remove as much stress and anxiety as possible.”
                </blockquote>
                <div className="w-12 h-px bg-stone-700 mx-auto" />
              </div>
            </FadeIn>
          </div>
        </section>

        {/* How Ditto Helps */}
        <section id="how-it-works" className="py-32 px-6">
          <div className="max-w-5xl mx-auto">
            <FadeIn>
              <div className="text-center mb-20">
                <h2 className="text-4xl mb-4">Thoughtful coordination</h2>
                <p className="text-stone-600 font-light">Everything in its right place, shared with the right people.</p>
              </div>
            </FadeIn>
            
            <div className="grid md:grid-cols-3 gap-12">
              <FadeIn delay={0.1}>
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                    <FileText size={20} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl">Document Vault</h3>
                  <p className="text-stone-600 text-sm leading-relaxed font-light">
                    Securely store death certificates, wills, and insurance policies. 
                    Accessible to those who need them, hidden from those who don't.
                  </p>
                </div>
              </FadeIn>

              <FadeIn delay={0.2}>
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                    <CheckCircle2 size={20} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl">Guided Tasks</h3>
                  <p className="text-stone-600 text-sm leading-relaxed font-light">
                    A gentle, step-by-step checklist of what needs to be done, from 
                    notifying authorities to planning the memorial service.
                  </p>
                </div>
              </FadeIn>

              <FadeIn delay={0.3}>
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                    <Users size={20} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl">Family Sync</h3>
                  <p className="text-stone-600 text-sm leading-relaxed font-light">
                    Coordinate with siblings and relatives without endless threads. 
                    Assign tasks and share updates in a calm, central hub.
                  </p>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* What's Included */}
        <section className="py-32 bg-stone-900 text-stone-50">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-20">
              <FadeIn>
                <h2 className="text-4xl text-stone-50 leading-tight">
                  A complete companion <br />
                  for the journey.
                </h2>
              </FadeIn>
              <div className="space-y-8">
                <FadeIn delay={0.2}>
                  <ul className="space-y-6">
                    {[
                      "Funeral and memorial service planning tools",
                      "Financial and estate document organization",
                      "Digital legacy and account management",
                      "Collaborative family task lists",
                      "Professional service directory and contacts",
                      "Grief support resources and guidance"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0" />
                        <span className="text-stone-300 font-light leading-tight">{item}</span>
                      </li>
                    ))}
                  </ul>
                </FadeIn>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing">
          <Subscription />
        </section>

        {/* FAQ Section */}
        <section id="faq">
          <FAQ />
        </section>

        {/* Privacy & Security */}
        <section id="security" className="py-32 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <FadeIn>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stone-100 text-stone-600 mb-8">
                <Shield size={24} strokeWidth={1.5} />
              </div>
              <h2 className="text-4xl mb-6">Your privacy is sacred.</h2>
              <p className="text-stone-600 leading-relaxed font-light mb-8">
                We understand the sensitivity of the information you entrust to us. 
                Ditto uses bank-level encryption and private sharing controls to 
                ensure your family's data remains exactly that—yours.
              </p>
              <div className="flex flex-wrap justify-center gap-8 text-stone-400 text-sm font-medium uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  End-to-end encryption
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  No data selling
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  GDPR Compliant
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-48 bg-stone-100 text-center px-6">
          <div className="max-w-2xl mx-auto">
            <FadeIn>
              <Heart className="mx-auto mb-8 text-stone-300" size={32} strokeWidth={1} />
              <h2 className="text-4xl mb-8 leading-tight">We’re here when you need us.</h2>
              <p className="text-stone-600 mb-12 font-light leading-relaxed">
                Take your time. There is no rush. When you are ready to begin 
                organizing, we are ready to help.
              </p>
              <button 
                onClick={handleStart}
                className="px-10 py-5 bg-stone-900 text-stone-50 rounded-full text-sm font-medium hover:bg-stone-800 transition-all shadow-md"
              >
                Begin when you’re ready
              </button>
            </FadeIn>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-20 border-t border-stone-200">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <button 
            onClick={() => setView("landing")}
            className="font-serif text-xl text-stone-900 hover:opacity-70 transition-opacity"
          >
            Ditto
          </button>
          <div className="flex gap-8 text-xs text-stone-400 font-medium uppercase tracking-widest">
            <button onClick={handleVendorPortal} className="hover:text-stone-600 transition-colors">Vendor Portal</button>
            <a href="#faq" className="hover:text-stone-600 transition-colors">FAQ</a>
            <a href="#" className="hover:text-stone-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-stone-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-stone-600 transition-colors">Contact Us</a>
          </div>
          <div className="text-xs text-stone-400 font-light">
            © {new Date().getFullYear()} Ditto. All rights reserved.
          </div>
        </div>
      </footer>
      <AIChat />
    </div>
  );
}
