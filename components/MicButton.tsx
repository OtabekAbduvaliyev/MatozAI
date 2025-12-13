import React from "react";
import { Mic } from "lucide-react";

interface MicButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onClick: () => void;
}

const MicButton: React.FC<MicButtonProps> = ({
  isRecording,
  isProcessing,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isProcessing}
      className={`
        relative flex items-center justify-center 
        w-20 h-20
        rounded-4xl /* Soft Squircle */
        transition-all duration-300 ease-out transform active:scale-95 cursor-pointer
        ${
          isRecording
            ? "bg-emerald-500 shadow-lg shadow-emerald-500/40 dark:shadow-emerald-900/50 scale-105"
            : "bg-emerald-500 shadow-md shadow-emerald-500/20 dark:shadow-emerald-900/30 hover:bg-emerald-400"
        }
      `}
      aria-label={isRecording ? "To'xtatish" : "Yozish"}
    >
      <div
        className={`
            absolute inset-0 bg-white opacity-0 rounded-4xl transition-opacity duration-500
            ${isProcessing ? "opacity-20 animate-pulse" : ""}
      `}
      ></div>

      {isRecording ? (
        <div className="bg-white rounded-md w-8 h-8 shadow-sm animate-in fade-in zoom-in duration-200"></div>
      ) : (
        <Mic className="w-8 h-8 text-white" />
      )}
    </button>
  );
};

export default MicButton;
