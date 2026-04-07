import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X, Send, Sparkles, Minus, Maximize2, Info } from "lucide-react";
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: "user" | "model";
  text: string;
}

const SYSTEM_INSTRUCTION = `You are Clara, Ditto's premiere AI Concierge. Your purpose is to provide high-touch, compassionate assistance to families navigating the logistics of loss. 

As a Concierge, you don't just provide information; you anticipate needs and facilitate actions. 

You provide guidance on:
1. Obtaining essential documents:
   - Death Certificates: Usually obtained through the funeral home or the state/county vital records office.
   - Wills: Often found in safe deposit boxes, with attorneys, or in secure home files.
   - Insurance Policies: Check employer benefits, bank statements for premiums, or use the NAIC Life Insurance Policy Locator.
   - Social Security: Funeral homes often notify them, but families may need to call 1-800-772-1213.
2. Explaining end-of-life planning steps: From immediate notifications to memorial planning and estate settlement.
3. 'How-to' assistance for the Ditto app: Using the Document Vault, Vendor Coordination, Family Sync, and Travel assistance.
4. Facilitating logistics: Mentioning that you can help generate necessary authorizations (like Release and Embalming forms) to expedite transport.

Your tone is sophisticated, supportive, clear, patient, and deeply empathetic. 
Avoid medical or legal advice; instead, point users toward where they can find official information or professional help. 
If a user is overwhelmed, offer gentle encouragement and remind them that you are here to handle the heavy lifting. 
Keep responses concise but thorough. Use bullet points for steps.`;

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: "Hello. I am Clara, your Ditto Concierge. I am here to handle the details so you can focus on what matters. How may I assist you today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: (process as any).env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      const chatHistory = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model,
        contents: [
          ...chatHistory,
          { role: "user", parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        }
      });

      const aiText = response.text || "I'm sorry, I couldn't process that. Could you try rephrasing?";
      setMessages(prev => [...prev, { role: "model", text: aiText }]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages(prev => [...prev, { role: "model", text: "I'm having a little trouble connecting right now. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? "64px" : "500px"
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[380px] bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden mb-4 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 bg-stone-900 text-stone-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center">
                  <Sparkles size={16} className="text-stone-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">Clara</h3>
                  {!isMinimized && <p className="text-[10px] text-stone-400 uppercase tracking-widest">Premiere Concierge</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-stone-800 rounded-lg transition-colors"
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minus size={16} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-stone-800 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-stone-50/50">
                  {messages.map((m, i) => (
                    <div 
                      key={i} 
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div 
                        className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                          m.role === "user" 
                            ? "bg-stone-900 text-stone-50 rounded-tr-none" 
                            : "bg-white border border-stone-200 text-stone-900 rounded-tl-none shadow-sm"
                        }`}
                      >
                        {m.text.split('\n').map((line, index) => (
                          <React.Fragment key={index}>
                            {line}
                            {index < m.text.split('\n').length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-stone-200 p-4 rounded-2xl rounded-tl-none shadow-sm">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" />
                          <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-stone-100">
                  <div className="relative">
                    <input 
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask me anything..."
                      className="w-full pl-4 pr-12 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-stone-900 outline-none transition-all text-sm"
                    />
                    <button 
                      onClick={handleSend}
                      disabled={isLoading || !input.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-stone-400 hover:text-stone-900 disabled:opacity-30 transition-colors"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-400 text-center mt-3 flex items-center justify-center gap-1">
                    <Info size={10} />
                    AI guide for informational purposes
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        className={`w-14 h-14 rounded-full bg-stone-900 text-stone-50 flex items-center justify-center shadow-xl hover:bg-stone-800 transition-all ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageCircle size={24} />
      </motion.button>
    </div>
  );
}
