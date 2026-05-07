import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, FileText, MapPin, Star, ExternalLink, Clock, AlertCircle, Phone } from 'lucide-react';
import { useFirebase } from './FirebaseProvider';

export default function NextStepsView() {
  const { familyData } = useFirebase();
  const [nextSteps, setNextSteps] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [deceased, setDeceased] = useState<any>(null);

  useEffect(() => {
    if (familyData?.nextSteps) {
      setNextSteps(familyData.nextSteps);
      setBusinesses(Array.isArray(familyData.localBusinesses) ? familyData.localBusinesses : []);
      setDeceased({
        firstName: familyData.deceased?.fullName?.split(' ')?.[0],
        location: {
          city: familyData.preferences?.city,
          state: familyData.preferences?.state,
        },
      });
      return;
    }

    try {
      const storedSteps = localStorage.getItem('ditto_next_steps');
      const storedBusinesses = localStorage.getItem('ditto_businesses');
      const storedDeceased = localStorage.getItem('ditto_deceased');
      
      if (storedSteps) setNextSteps(JSON.parse(storedSteps));
      if (storedBusinesses) setBusinesses(JSON.parse(storedBusinesses));
      if (storedDeceased) setDeceased(JSON.parse(storedDeceased));
    } catch (e) {
      console.error("Failed to load AI generated data", e);
    }
  }, [familyData]);

  if (!nextSteps) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-stone-500 space-y-4 p-12">
        <AlertCircle size={48} className="text-stone-300" />
        <h2 className="text-xl font-serif text-stone-900">No Next Steps Generated</h2>
        <p className="font-light text-center max-w-md">
          We haven't generated your personalized guide yet. This usually happens after you complete the onboarding process.
        </p>
      </div>
    );
  }

  const locationStr = deceased?.location 
    ? `${deceased.location.city}, ${deceased.location.state}`
    : 'your area';

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-24">
      <header className="space-y-4">
        <h1 className="text-4xl font-serif text-stone-900 tracking-tight">Your Personalized Guide</h1>
        <p className="text-lg text-stone-500 font-light max-w-2xl">
          Based on the information provided for {deceased?.firstName || 'your loved one'} in {locationStr}, we have compiled a demystified list of next steps, required documents, and local business references.
        </p>
      </header>

      {/* Action Plan */}
      <section className="space-y-6">
        <h2 className="text-sm font-medium text-stone-400 uppercase tracking-widest px-1">Action Plan</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Immediate */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="font-medium text-stone-900">Immediate</h3>
                <p className="text-xs text-stone-400">First 24-48 hours</p>
              </div>
            </div>
            <ul className="space-y-4">
              {nextSteps.nextSteps?.immediateActions?.map((action: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm text-stone-600 font-light">
                  <CheckCircle2 size={16} className="text-stone-300 shrink-0 mt-0.5" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Short Term */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="font-medium text-stone-900">Short-Term</h3>
                <p className="text-xs text-stone-400">First Week</p>
              </div>
            </div>
            <ul className="space-y-4">
              {nextSteps.nextSteps?.shortTermActions?.map((action: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm text-stone-600 font-light">
                  <CheckCircle2 size={16} className="text-stone-300 shrink-0 mt-0.5" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Long Term */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="font-medium text-stone-900">Long-Term</h3>
                <p className="text-xs text-stone-400">Coming Months</p>
              </div>
            </div>
            <ul className="space-y-4">
              {nextSteps.nextSteps?.longTermActions?.map((action: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm text-stone-600 font-light">
                  <CheckCircle2 size={16} className="text-stone-300 shrink-0 mt-0.5" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Required Documents */}
      <section className="space-y-6">
        <h2 className="text-sm font-medium text-stone-400 uppercase tracking-widest px-1">Required Documents & Guidance</h2>
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-stone-100">
          {nextSteps.requiredDocuments?.map((doc: any, i: number) => (
            <div key={i} className="p-6 hover:bg-stone-50 transition-colors">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1 space-y-2">
                  <h3 className="font-medium text-stone-900 text-lg flex items-center gap-2">
                    <FileText size={18} className="text-stone-400" />
                    {doc.documentName}
                  </h3>
                  <p className="text-sm text-stone-500 font-light">{doc.description}</p>
                </div>
                <div className="flex-1 bg-stone-100/50 p-4 rounded-xl border border-stone-200/50">
                  <h4 className="text-xs font-medium text-stone-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <MapPin size={14} className="text-stone-400" />
                    How to obtain in {locationStr}
                  </h4>
                  <p className="text-sm text-stone-600 font-light leading-relaxed">
                    {doc.obtainingGuidance}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Local Businesses */}
      {businesses && businesses.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-sm font-medium text-stone-400 uppercase tracking-widest px-1">Local Service Providers</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {businesses.map((business: any, i: number) => (
              <div key={i} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between group hover:border-stone-400 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 bg-stone-100 px-2 py-1 rounded-md">
                      {business.category.replace('_', ' ')}
                    </span>
                    {business.rating && (
                      <div className="flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-lg border border-stone-100">
                        <Star size={14} className="text-amber-400 fill-amber-400" />
                        <span className="text-sm font-medium text-stone-700">{business.rating}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-serif font-medium text-stone-900 mb-2">{business.name}</h3>
                  <p className="text-sm text-stone-500 flex items-start gap-2 mb-2">
                    <MapPin size={16} className="shrink-0 mt-0.5 text-stone-400" />
                    {business.address}
                  </p>
                  {business.phoneNumber && (
                    <p className="text-sm text-stone-500 flex items-center gap-2">
                      <Phone size={16} className="text-stone-400" />
                      {business.phoneNumber}
                    </p>
                  )}
                </div>
                {business.websiteUrl && (
                  <div className="mt-6 pt-4 border-t border-stone-100">
                    <a 
                      href={business.websiteUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-stone-900 flex items-center gap-2 hover:opacity-70 transition-opacity"
                    >
                      Visit Website <ExternalLink size={14} />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
