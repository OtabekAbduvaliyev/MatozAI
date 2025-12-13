import React from "react";
import { TranscriptionItem } from "../types";
import { Trash2, Copy } from "lucide-react";

interface HistoryListProps {
  items: TranscriptionItem[];
  onDelete: (id: string) => void;
  onCopy: (text: string) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({
  items,
  onDelete,
  onCopy,
}) => {
  if (items.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mt-12 px-6 pb-24 border-t border-slate-100 pt-8">
      <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-6">
        Saved Sessions
      </h3>
      <div className="space-y-6">
        {items.map((item) => (
          <div key={item.id} className="group relative">
            <div className="flex justify-between items-start gap-4">
              <p className="text-slate-600 font-mono text-sm leading-relaxed line-clamp-2 hover:line-clamp-none transition-all">
                {item.text}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onCopy(item.text)}
                  className="text-slate-300 hover:text-emerald-600 transition-colors cursor-pointer"
                  title="Copy"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <span className="text-[10px] text-slate-300 font-mono mt-2 block">
              {item.timestamp.toLocaleDateString()} •{" "}
              {item.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
