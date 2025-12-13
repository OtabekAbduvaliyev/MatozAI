import React from "react";
import { X, Copy, Languages, Check } from "lucide-react";

interface TranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
  translatedText: string;
  isLoading: boolean;
  activeLang: "en" | "ru";
  onLanguageChange: (lang: "en" | "ru") => void;
}

const TranslationModal: React.FC<TranslationModalProps> = ({
  isOpen,
  onClose,
  translatedText,
  isLoading,
  activeLang,
  onLanguageChange,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-900/10">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Languages className="w-5 h-5" />
            <h3 className="font-bold text-lg">Tarjima</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => onLanguageChange("en")}
            className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer ${activeLang === "en"
                ? "text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
          >
            English
          </button>
          <button
            onClick={() => onLanguageChange("ru")}
            className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer ${activeLang === "ru"
                ? "text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
          >
            Русский
          </button>
        </div>

        {/* Body */}
        <div className="p-6 min-h-[200px] max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-4">
              <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-sm text-slate-500 animate-pulse">
                Tarjima qilinmoqda...
              </p>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {translatedText}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && translatedText && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-950/50">
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
        )}
      </div>
    </div>
  );
};

export default TranslationModal;
