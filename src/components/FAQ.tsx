import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus, HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "What are the first steps I should take immediately after a death?",
    answer: "The immediate steps depend on where the death occurred. If at home under hospice care, call the hospice nurse. If unexpected, call 911. If in a hospital or nursing home, the staff will handle the legal pronouncement. Your next step is to notify immediate family and then contact a funeral home to arrange for transport."
  },
  {
    question: "How do I obtain a legal pronouncement of death?",
    answer: "A legal pronouncement is required before a body can be moved. In a hospital or facility, a doctor or nurse will do this. If the death happens at home under hospice, the hospice nurse is authorized. If no medical professional is present, emergency services (911) must be called."
  },
  {
    question: "When should I contact a funeral home?",
    answer: "You should contact a funeral home within the first few hours after the death has been legally pronounced. They will coordinate the transportation of your loved one and help you begin the process of arranging services and obtaining death certificates."
  },
  {
    question: "How do I notify the Social Security Administration?",
    answer: "In most cases, the funeral director will notify Social Security for you if you provide the deceased's Social Security number. However, you should still call them at 1-800-772-1213 to ensure any monthly benefits are stopped and to inquire about the one-time survivor benefit."
  },
  {
    question: "Where can I find my loved one's will or estate documents?",
    answer: "Common places to look include safe deposit boxes, home safes, filing cabinets, or with their personal attorney. If you cannot find a physical copy, check with the local probate court to see if a will was filed for safekeeping."
  },
  {
    question: "How many copies of the death certificate should I order?",
    answer: "It is generally recommended to order 10 to 15 certified copies. You will need them for life insurance claims, closing bank accounts, transferring titles (car/home), and dealing with the IRS and Social Security."
  },
  {
    question: "What happens to my loved one's social media and digital accounts?",
    answer: "Most platforms like Facebook and Google have 'legacy' settings. You can either request to have the account memorialized or closed. You will typically need a copy of the death certificate and proof of your relationship to the deceased."
  },
  {
    question: "How do I handle my loved one's mail and subscriptions?",
    answer: "Visit the USPS website or local post office to forward mail to the executor's address. Go through bank statements to identify recurring subscriptions (Netflix, gym, utilities) and contact those companies to cancel or transfer the accounts."
  },
  {
    question: "What should I do about their pets or immediate living arrangements?",
    answer: "Ensure any pets have immediate care, food, and water. Secure the home by locking all doors and windows. If the home will be vacant, consider setting timers for lights and asking a neighbor to keep an eye on the property."
  },
  {
    question: "How do I notify the employer or Veteran Affairs?",
    answer: "Contact the HR department of their last employer to inquire about unpaid salary, 401k, or group life insurance. If they were a veteran, contact the VA at 1-800-827-1000 to discuss burial benefits and survivor pensions."
  },
  {
    question: "What is the difference between an executor and a next of kin?",
    answer: "Next of kin is a person's closest living blood relative. An executor is the person specifically named in a will to manage the estate. While they are often the same person, the executor has the legal authority to handle financial and legal matters."
  },
  {
    question: "How can Ditto help me organize all these tasks?",
    answer: "Ditto provides a central, secure hub for your family. You can use our Document Vault to store certificates and wills, our Guided Checklists to track every immediate task, and our Vendor Portal to coordinate directly with funeral homes and florists."
  }
];

const AccordionItem: React.FC<{ item: FAQItem; isOpen: boolean; onClick: () => void }> = ({ item, isOpen, onClick }) => {
  return (
    <div className="border-b border-stone-200 last:border-none">
      <button
        onClick={onClick}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className={`text-lg font-serif transition-colors ${isOpen ? 'text-stone-900' : 'text-stone-600 group-hover:text-stone-900'}`}>
          {item.question}
        </span>
        <div className={`shrink-0 ml-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          {isOpen ? <Minus size={20} className="text-stone-900" /> : <Plus size={20} className="text-stone-400" />}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-stone-500 font-light leading-relaxed max-w-3xl">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-32 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-stone-100 text-stone-600 mb-6">
            <HelpCircle size={24} strokeWidth={1.5} />
          </div>
          <h2 className="text-4xl font-serif text-stone-900 mb-4">Common Questions</h2>
          <p className="text-stone-500 font-light">Immediate guidance for the first 24-48 hours.</p>
        </div>

        <div className="bg-stone-50/50 rounded-3xl p-8 md:p-12 border border-stone-100">
          {FAQS.map((faq, index) => (
            <AccordionItem
              key={index}
              item={faq}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-stone-400 font-light">
            Don't see your question? Ask our <span className="font-medium text-stone-600">Ditto Guide</span> in the chat below.
          </p>
        </div>
      </div>
    </section>
  );
}
