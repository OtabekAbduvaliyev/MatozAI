import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Share2, Download, RotateCcw } from "lucide-react";
import { shareAudio, downloadAudio, formatDuration } from "../utils/audioUtils";
import api from "../services/api";

interface AudioPlayerProps {
  audioBlob: Blob | null;
  audioUrl?: string | null;
  onReset: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioBlob,
  audioUrl,
  onReset,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [message, setMessage] = useState<string | null>(null); // Local toast
  const [fetchedBlob, setFetchedBlob] = useState<Blob | null>(null);

  // Initialize Audio
  useEffect(() => {
    let active = true;
    let objectUrl = "";

    const loadAudio = async () => {
      try {
        let blob = audioBlob;

        if (!blob && audioUrl) {
          // Fetch secure audio
          const response = await api.get(audioUrl, { responseType: "blob" });
          blob = response.data;
          if (active) setFetchedBlob(blob);
        }

        if (!blob || !active) return;

        objectUrl = URL.createObjectURL(blob);
        const audio = new Audio(objectUrl);
        audioRef.current = audio;

        audio.addEventListener("loadedmetadata", () => {
          if (active && isFinite(audio.duration)) {
            setDuration(audio.duration);
          }
        });

        audio.addEventListener("timeupdate", () => {
          if (active) setCurrentTime(audio.currentTime);
        });

        audio.addEventListener("ended", () => {
          if (active) {
            setIsPlaying(false);
            setCurrentTime(0);
          }
        });
      } catch (err) {
        console.error("Failed to load audio", err);
        if (active) setMessage("Audio yuklashda xatolik");
      }
    };

    loadAudio();

    return () => {
      active = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [audioBlob, audioUrl]);

  // Auto-hide toast
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleShare = async () => {
    const blobToShare = audioBlob || fetchedBlob;
    if (blobToShare) {
      const success = await shareAudio(blobToShare);
      setShowShareMenu(false);
      if (!success) {
        setMessage("Ulashish imkonsiz. Fayl yuklanmoqda...");
        downloadAudio(blobToShare);
      }
    }
  };

  const handleDownload = () => {
    const blobToDownload = audioBlob || fetchedBlob;
    if (blobToDownload) {
      downloadAudio(blobToDownload);
    }
    setShowShareMenu(false);
    setMessage("Fayl yuklanmoqda...");
  };

  return (
    <div className="flex items-center justify-between w-full h-full gap-3 relative">
      {/* Local Toast Overlay */}
      {message && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2">
          {message}
        </div>
      )}

      {/* Play Button */}
      <button
        onClick={togglePlay}
        className="flex-none w-10 h-10 flex items-center justify-center rounded-full shadow-sm hover:scale-105 transition-all bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-500 dark:text-emerald-400 cursor-pointer"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Scrubber & Time */}
      <div className="flex-1 flex flex-col justify-center gap-1">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 relative">
        <button
          onClick={() => setShowShareMenu(!showShareMenu)}
          className={`p-2 transition-colors rounded-full cursor-pointer ${
            showShareMenu
              ? "bg-slate-100 dark:bg-slate-800 text-emerald-500"
              : "text-slate-500 hover:text-emerald-500 dark:text-slate-400"
          }`}
        >
          <Share2 className="w-5 h-5" />
        </button>

        {/* Share Menu Popover */}
        {showShareMenu && (
          <div className="absolute bottom-full right-0 mb-3 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-2 flex flex-col gap-1 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
            <button
              onClick={handleShare}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Ulashish</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5">
              <div className="h-px bg-slate-200 dark:bg-slate-700 w-full"></div>
              <span className="text-[10px] text-slate-400 uppercase">Yoki</span>
              <div className="h-px bg-slate-200 dark:bg-slate-700 w-full"></div>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Yuklab olish</span>
            </button>
          </div>
        )}

        <button
          onClick={onReset}
          className="p-2 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default AudioPlayer;
