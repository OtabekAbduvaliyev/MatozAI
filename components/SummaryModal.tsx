import React, { useState, useRef, useEffect } from "react";
import { X, Copy, Sparkles, Check, MessageSquare, Send, User, Bot } from "lucide-react";

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string;
  isLoading: boolean;
}

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: number;
}

const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  summary,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<"summary" | "chat">("summary");
  const [copied, setCopied] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset tab when opening
  useEffect(() => {
    if (isOpen) {
      setActiveTab("summary");
    }
  }, [isOpen]);

  // Initialize Chat
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initialMsgs: Message[] = [
        {
          id: "1",
          role: "ai",
          content: "Salom! Men suhbat bo'yicha yordamchingizman. Xulosa yoki matn bo'yicha qanday savollaringiz bor?",
          timestamp: Date.now(),
        },
      ];
      setMessages(initialMsgs);
    }
  }, [isOpen]);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputValue("");

    // Mock AI Response
    setTimeout(() => {
      const newAiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: "Bu hozircha faqat dizayn. Tez orada bu yerda sun'iy intellekt javob beradi!",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, newAiMsg]);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-900/10">
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("summary")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "summary"
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Xulosa
                </span>
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "chat"
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Suhbat
                </span>
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === "summary" ? (
            <div className="p-6 overflow-y-auto min-h-[200px]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-40 space-y-4">
                  <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
                  <p className="text-sm text-slate-500 animate-pulse">
                    Matn tahlil qilinmoqda...
                  </p>
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {summary || "Hozircha xulosa yo'q."}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""
                      }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex-none w-8 h-8 rounded-full flex items-center justify-center ${msg.role === "user"
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                    >
                      {msg.role === "user" ? (
                        <User className="w-5 h-5" />
                      ) : (
                        <Bot className="w-5 h-5" />
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.role === "user"
                          ? "bg-emerald-600 text-white rounded-tr-none"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none"
                        }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          {activeTab === "summary" ? (
            !isLoading && (
              <div className="flex justify-end">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copied ? "Nusxalandi" : "Nusxalash"}
                </button>
              </div>
            )
          ) : (
            <div className="relative flex items-end gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Savolingizni yozing..."
                className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none focus:ring-0 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 resize-none py-2.5 px-3 text-sm scrollbar-hide"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="flex-none p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryModal;
