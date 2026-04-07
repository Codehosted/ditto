import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Edit3, Share2, Printer } from 'lucide-react';

export default function Obituary() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <header className="space-y-4 max-w-2xl">
        <h1 className="text-4xl font-serif text-stone-900 tracking-tight">Obituary</h1>
        <p className="text-lg text-stone-500 font-light">
          Draft, edit, and share the obituary. We provide templates to help you honor their memory with the right words.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm min-h-[500px]">
            <div className="flex justify-between items-center mb-6 pb-6 border-b border-stone-100">
              <h2 className="font-serif text-2xl text-stone-900">Draft</h2>
              <button className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors">
                <Edit3 size={16} /> Edit
              </button>
            </div>
            <div className="prose prose-stone max-w-none font-serif text-stone-700 leading-relaxed">
              <p className="italic text-stone-400">Start writing or use a template to generate a draft...</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-stone-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <button className="w-full py-3 bg-stone-900 text-stone-50 rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2">
                <Share2 size={16} /> Share Draft
              </button>
              <button className="w-full py-3 bg-white border border-stone-200 text-stone-900 rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors flex items-center justify-center gap-2">
                <Printer size={16} /> Print Preview
              </button>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-stone-900 mb-4">Templates</h3>
            <div className="space-y-3">
              {['Traditional', 'Modern', 'Celebration of Life'].map((template) => (
                <button key={template} className="w-full p-3 text-left border border-stone-100 rounded-xl hover:border-stone-300 transition-colors group">
                  <div className="text-sm font-medium text-stone-900 group-hover:text-stone-600">{template}</div>
                  <div className="text-xs text-stone-400 mt-1">Apply this style</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
