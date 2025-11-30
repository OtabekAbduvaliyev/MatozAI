import React, { useEffect, useRef } from 'react';
import { Script, toCyrillic } from '../utils/transliteration';

interface TranscriptionDisplayProps {
  fullText: string;
  liveSnippet: string;
  onTextChange: (text: string) => void;
  isRecording: boolean;
  script: Script;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ 
  fullText,
  liveSnippet,
  onTextChange,
  isRecording, 
  script
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const formatText = (text: string) => script === 'cyr' ? toCyrillic(text) : text;
  
  const displayText = formatText(fullText + (liveSnippet ? (fullText ? ' ' : '') + liveSnippet : ''));

  useEffect(() => {
    if (isRecording && textareaRef.current) {
        const ta = textareaRef.current;
        ta.scrollTop = ta.scrollHeight;
    }
  }, [displayText, isRecording]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTextChange(e.target.value);
  };

  return (
    <div className="w-full h-full relative group">
      <textarea
        ref={textareaRef}
        value={displayText}
        onChange={handleChange}
        placeholder={isRecording ? "" : "Gapirishni boshlash uchun bosing..."}
        className={`
          w-full h-full 
          bg-transparent 
          resize-none 
          outline-none 
          border-none
          px-6 py-4
          text-lg md:text-xl 
          leading-relaxed 
          font-normal
          no-scrollbar
          transition-colors duration-300
          text-slate-700 dark:text-slate-200 
          placeholder:text-slate-400 dark:placeholder:text-slate-600
        `}
        spellCheck={false}
      />
      
      {/* Live Snippet Indicator */}
      {isRecording && liveSnippet && (
         <div className="absolute bottom-4 right-6 pointer-events-none">
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
         </div>
      )}
    </div>
  );
};

export default TranscriptionDisplay;