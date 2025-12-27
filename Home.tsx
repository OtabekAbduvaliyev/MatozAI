import React, { useState, useRef, useEffect } from "react";
import MicButton from "./components/MicButton";
import AudioVisualizer from "./components/AudioVisualizer";
import TranscriptionDisplay from "./components/TranscriptionDisplay";
import AudioPlayer from "./components/AudioPlayer";
import HistoryDrawer from "./components/HistoryDrawer";
import SummaryModal from "./components/SummaryModal";
import TranslationModal from "./components/TranslationModal";
import ConfirmModal from "./components/ConfirmModal";
import {
  Copy,
  Sun,
  Moon,
  History,
  Plus,
  UploadCloud,
  Sparkles,
  Languages,
  FileDown,
  FileText,
  LogOut,
  Mic,
  Video,
  Image as ImageIcon,
} from "lucide-react";
import { formatDuration } from "./utils/audioUtils";
import { exportToPdf, exportToWord, exportToTxt } from "./utils/exportUtils";
import { GeminiService } from "./services/geminiService";
import { storageService } from "./services/storageService";
import { authService } from "./services/authService";
import { Script } from "./utils/transliteration";
import { SavedSession } from "./types";

import { socketService } from "./services/socketService";

type AppState = "IDLE" | "RECORDING" | "PROCESSING" | "REVIEW";
type Theme = "light" | "dark";

// Local storage key for PREFERENCES only, data goes to Backend
const PREFS_KEY = "Sadoo_prefs_v1";

const Home: React.FC = () => {
  const [appState, setAppState] = useState<AppState>("IDLE");
  const [script, setScript] = useState<Script>("lat");
  const [theme, setTheme] = useState<Theme>("dark");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);

  // Summarizer State
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryCache, setSummaryCache] = useState(""); // Cache for summary

  // Translation State
  const [isTranslationOpen, setIsTranslationOpen] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationLang, setTranslationLang] = useState<"en" | "ru">("en");
  const [translationCache, setTranslationCache] = useState<
    Record<string, string>
  >({});

  // Export State
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Upload Type Chooser State
  const [isUploadDropdownOpen, setIsUploadDropdownOpen] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState<
    "audio" | "video" | "image"
  >("audio");

  // New Chat Loading State
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);

  // Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // UI Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Text State
  const [fullText, setFullText] = useState("");
  const [liveSnippet, setLiveSnippet] = useState("");

  // Audio State
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Refs
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const geminiService = useRef(new GeminiService());
  const committedTextRef = useRef("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const uploadDropdownRef = useRef<HTMLDivElement>(null);

  // 1. Initialize & Load Prefs & Socket
  useEffect(() => {
    try {
      const savedPrefs = localStorage.getItem(PREFS_KEY);
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        if (parsed.script) setScript(parsed.script);
        if (parsed.theme) setTheme(parsed.theme);
      }

      // Connect Socket
      socketService.connect();

      // Initialize DB/Backend and load history
      refreshHistory();

      return () => {
        socketService.disconnect();
      };
    } catch (e) {
      console.error("Init Error:", e);
    }
  }, []);

  // Toast Timer
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Click Outside Handler for Export Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target as Node)
      ) {
        setIsExportOpen(false);
      }
    };

    if (isExportOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExportOpen]);

  // Click Outside Handler for Upload Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        uploadDropdownRef.current &&
        !uploadDropdownRef.current.contains(event.target as Node)
      ) {
        setIsUploadDropdownOpen(false);
      }
    };

    if (isUploadDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUploadDropdownOpen]);

  const refreshHistory = async () => {
    try {
      const sessions = await storageService.getSessions();
      setSavedSessions(sessions);
    } catch (e) {
      console.error("History Load Error", e);
    }
  };

  // 2. Sync Theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // 3. Save Prefs
  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ script, theme }));
  }, [script, theme]);

  const handleTranscriptionUpdate = (text: string, isFinal: boolean) => {
    if (isFinal) {
      if (text.trim()) {
        const prefix = committedTextRef.current.trim() ? " " : "";
        const newCommitted = committedTextRef.current + prefix + text.trim();
        committedTextRef.current = newCommitted;
        setFullText(newCommitted);
        // Clear translation and summary cache as source text changed
        setTranslationCache({});
        setSummaryCache("");
      }
      setLiveSnippet("");
    } else {
      setLiveSnippet(text);
    }
  };

  const startRecording = async () => {
    setRecordingDuration(0);
    // Auto-save previous session if restarting from review
    if (appState === "REVIEW") {
      await handleSaveToHistory();
      setFullText("");
      committedTextRef.current = "";
      committedTextRef.current = "";
      setAudioBlob(null);
      setAudioUrl(null);
      setTranslationCache({});
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: { ideal: 16000 },
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
        },
      });
      streamRef.current = stream;

      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/mp4")) mimeType = "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAppState("REVIEW");
      };

      recorder.start(100);

      geminiService.current.connect(stream, {
        onOpen: () => {
          console.log("Gemini Ulandi");
        },
        onTranscriptionUpdate: handleTranscriptionUpdate,
        onError: (err) => {
          console.error("Gemini Xatosi", err);
        },
        onClose: () => {
          console.log("Gemini Yopildi");
        },
      });

      setAppState("RECORDING");

      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        setRecordingDuration((Date.now() - startTime) / 1000);
      }, 100);
    } catch (err) {
      console.error("Start failed:", err);
      alert("Mikrofonga ruxsat berilmadi.");
      setAppState("IDLE");
    }
  };

  const stopRecording = () => {
    setAppState("PROCESSING");
    if (liveSnippet.trim()) {
      const prefix = committedTextRef.current.trim() ? " " : "";
      const final = committedTextRef.current + prefix + liveSnippet.trim();
      setFullText(final);
      committedTextRef.current = final;
      setTranslationCache({});
      setSummaryCache("");
    }
    setLiveSnippet("");

    if (mediaRecorderRef.current?.state !== "inactive")
      mediaRecorderRef.current?.stop();
    geminiService.current.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // --- FEATURES ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Increase limit to 50MB for videos
    const maxSize = file.type.startsWith("video/")
      ? 50 * 1024 * 1024
      : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(
        `Fayl hajmi juda katta (maks ${
          file.type.startsWith("video/") ? "50MB" : "20MB"
        })`
      );
      return;
    }

    executeReset(false); // Clear previous without saving

    setAppState("PROCESSING");

    // Detect file type
    const isAudio = file.type.startsWith("audio/");
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (isAudio) {
      setToastMessage("Ovoz fayli yuklanmoqda...");
      setAudioBlob(file);
      setAudioUrl(null);

      // Calculate duration for history
      const tempAudio = new Audio(URL.createObjectURL(file));
      tempAudio.onloadedmetadata = () => {
        setRecordingDuration(tempAudio.duration);
      };

      geminiService.current
        .transcribeAudioFile(file)
        .then((text) => {
          setFullText(text);
          committedTextRef.current = text;
          setTranslationCache({});
          setAppState("REVIEW");
          setToastMessage("Ovoz matnga aylantirildi");
        })
        .catch((err) => {
          console.error(err);
          alert("Ovoz faylini o'qishda xatolik yuz berdi");
          setAppState("IDLE");
        });
    } else if (isVideo) {
      setToastMessage("Video yuklanmoqda va qayta ishlanmoqda...");
      setAudioBlob(file);
      setAudioUrl(null);

      // Calculate duration for history
      const tempVideo = document.createElement("video");
      tempVideo.src = URL.createObjectURL(file);
      tempVideo.onloadedmetadata = () => {
        setRecordingDuration(tempVideo.duration);
      };

      geminiService.current
        .transcribeVideoFile(file)
        .then((text) => {
          setFullText(text);
          committedTextRef.current = text;
          setTranslationCache({});
          setAppState("REVIEW");
          setToastMessage("Video matnga aylantirildi");
        })
        .catch((err) => {
          console.error(err);
          alert("Videoni o'qishda xatolik yuz berdi");
          setAppState("IDLE");
        });
    } else if (isImage) {
      setToastMessage("Rasm yuklanmoqda va matn ajratilmoqda...");
      // For images, we don't have audio/duration
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingDuration(0);

      geminiService.current
        .extractTextFromImage(file)
        .then((text) => {
          setFullText(text);
          committedTextRef.current = text;
          setTranslationCache({});
          setAppState("REVIEW");
          setToastMessage("Rasmdan matn ajratildi");
        })
        .catch((err) => {
          console.error(err);
          alert("Rasmni o'qishda xatolik yuz berdi");
          setAppState("IDLE");
        });
    } else {
      alert("Noma'lum fayl turi. Iltimos, ovoz, video yoki rasm yuklang.");
      setAppState("IDLE");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSummarize = async () => {
    if (!fullText.trim()) return;
    setIsSummaryOpen(true);

    // Check if we already have a cached summary
    if (summaryCache) {
      setSummaryText(summaryCache);
      return;
    }

    setIsSummarizing(true);
    setSummaryText("");

    try {
      const summary = await geminiService.current.summarizeText(fullText);
      setSummaryText(summary);
      setSummaryCache(summary); // Cache the summary
    } catch (err) {
      setSummaryText("Xulosa qilishda xatolik yuz berdi.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleChat = async (
    history: { role: "user" | "ai"; content: string }[],
    message: string
  ): Promise<string> => {
    return geminiService.current.chat(fullText || "", history, message);
  };

  const handleTranslate = async (lang: "en" | "ru") => {
    if (!fullText.trim()) return;

    // If clicking the same language tab, don't do anything if already loaded
    if (lang === translationLang && translationCache[lang]) {
      return;
    }

    setTranslationLang(lang);
    setIsTranslationOpen(true);

    // Check cache
    if (translationCache[lang]) {
      setTranslatedText(translationCache[lang]);
      return;
    }

    setIsTranslating(true);
    setTranslatedText("");

    try {
      const translation = await geminiService.current.translateText(
        fullText,
        lang
      );
      setTranslatedText(translation);
      // Save to cache
      setTranslationCache((prev) => ({ ...prev, [lang]: translation }));
    } catch (err) {
      setTranslatedText("Tarjima qilishda xatolik yuz berdi.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleExport = (type: "pdf" | "word" | "txt") => {
    if (!fullText.trim()) return;
    if (type === "pdf") {
      exportToPdf(fullText);
    } else if (type === "word") {
      exportToWord(fullText);
    } else {
      exportToTxt(fullText);
    }
    setIsExportOpen(false);
    setToastMessage("Hujjat yuklanmoqda...");
  };

  // --------------------

  const handleSaveToHistory = async () => {
    if (!fullText && !audioBlob) return;

    const newSession: SavedSession = {
      id: Date.now().toString(),
      text: fullText,
      audioBlob: audioBlob,
      timestamp: Date.now(),
      duration: recordingDuration || 0,
    };

    await storageService.saveSession(newSession);
    refreshHistory();
  };

  const handleLoadSession = (session: SavedSession) => {
    setFullText(session.text);
    committedTextRef.current = session.text;
    setAudioBlob(session.audioBlob);
    setAudioUrl(session.audioUrl || null);
    setRecordingDuration(session.duration || 0);
    setTranslationCache({});
    setAppState("REVIEW");
    setIsHistoryOpen(false);
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteSessionId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteSession = async () => {
    if (!deleteSessionId) return;

    setSavedSessions((prev) => prev.filter((s) => s.id !== deleteSessionId));

    try {
      await storageService.deleteSession(deleteSessionId);
      refreshHistory();
      setToastMessage("Suhbat o'chirildi");
    } catch (err) {
      console.error("Delete failed", err);
      refreshHistory();
    }
  };

  const handleManualTextChange = (newText: string) => {
    setFullText(newText);
    committedTextRef.current = newText;
    setTranslationCache({}); // Invalidate cache
    setSummaryCache(""); // Invalidate summary cache
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(fullText);
    setToastMessage("Matn nusxalandi");
  };

  const handleResetRequest = () => {
    if (!fullText && !audioBlob) {
      executeReset(false);
      return;
    }
    setIsConfirmOpen(true);
  };

  const executeReset = async (save: boolean = true) => {
    if (save && appState === "REVIEW" && (fullText || audioBlob)) {
      await handleSaveToHistory();
    }
    setAppState("IDLE");
    setFullText("");
    committedTextRef.current = "";
    setLiveSnippet("");
    setLiveSnippet("");
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    setTranslationCache({});
    setSummaryCache("");
  };

  const handleNewConversation = async () => {
    // New conversation implies saving the old one automatically
    if (fullText || audioBlob) {
      setIsCreatingNewChat(true);
      await executeReset(true);
      setToastMessage("Yangi suhbat boshlandi (Avtomatik saqlandi)");
      setIsCreatingNewChat(false);
    } else {
      executeReset(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.code === "Space" || e.code === "Enter") &&
        appState !== "PROCESSING" &&
        !isConfirmOpen &&
        !isHistoryOpen &&
        !isSummaryOpen &&
        !isTranslationOpen
      ) {
        if (document.activeElement?.tagName === "TEXTAREA") return;
        if (document.activeElement?.tagName === "INPUT") return;

        e.preventDefault();
        if (appState === "RECORDING") stopRecording();
        else if (appState === "IDLE" || appState === "REVIEW") startRecording();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    appState,
    isConfirmOpen,
    isHistoryOpen,
    isSummaryOpen,
    isTranslationOpen,
  ]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300 relative">
      {/* Toast Notification */}
      <div
        className={`
          absolute top-20 left-1/2 -translate-x-1/2 z-50
          bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium
          transition-all duration-300 pointer-events-none flex items-center gap-2
          ${
            toastMessage
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-4"
          }
      `}
      >
        {toastMessage}
      </div>

      {/* 1. Header */}
      <header className="flex-none h-14 px-4 flex justify-between items-center z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Sadoo" className="w-8 h-8" />
          <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            Sadoo
          </h1>
          <button
            onClick={() => setScript((s) => (s === "lat" ? "cyr" : "lat"))}
            className="px-2 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer"
          >
            {script === "lat" ? "LOTIN" : "КИРИЛЛ"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            hidden
            accept={
              selectedFileType === "audio"
                ? "audio/*"
                : selectedFileType === "video"
                ? "video/*"
                : "image/*"
            }
            onChange={handleFileUpload}
          />

          <button
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            className="p-2 text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Mavzu"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="p-2 text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Tarix"
          >
            <History className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="p-2 text-slate-500 hover:text-red-500 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Chiqish"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. Main Text Editor (Fill Remaining) */}
      <div className="flex-1 w-full relative z-0">
        <TranscriptionDisplay
          fullText={fullText}
          liveSnippet={liveSnippet}
          onTextChange={handleManualTextChange}
          isRecording={appState === "RECORDING"}
          script={script}
        />

        {/* Floating Actions (Expandable) */}
        {fullText && (
          <div className="absolute top-4 right-4 flex flex-col items-end gap-3 z-20">
            <button
              onClick={handleCopyText}
              className="group flex items-center gap-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm border border-slate-200 dark:border-slate-700 rounded-full h-10 px-2.5 hover:px-4 text-slate-400 hover:text-emerald-500 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300 ease-out cursor-pointer"
            >
              <Copy className="w-4 h-4 flex-none" />
              <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] group-hover:ml-2 transition-all duration-300 whitespace-nowrap text-sm font-medium opacity-0 group-hover:opacity-100">
                Nusxalash
              </span>
            </button>

            <button
              onClick={handleSummarize}
              className="group flex items-center gap-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm border border-slate-200 dark:border-slate-700 rounded-full h-10 px-2.5 hover:px-4 text-slate-400 hover:text-emerald-500 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300 ease-out cursor-pointer"
            >
              <Sparkles className="w-4 h-4 flex-none" />
              <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] group-hover:ml-2 transition-all duration-300 whitespace-nowrap text-sm font-medium opacity-0 group-hover:opacity-100">
                Xulosa
              </span>
            </button>

            <button
              onClick={() => handleTranslate("en")}
              className="group flex items-center gap-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm border border-slate-200 dark:border-slate-700 rounded-full h-10 px-2.5 hover:px-4 text-slate-400 hover:text-emerald-500 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300 ease-out cursor-pointer"
            >
              <Languages className="w-4 h-4 flex-none" />
              <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] group-hover:ml-2 transition-all duration-300 whitespace-nowrap text-sm font-medium opacity-0 group-hover:opacity-100">
                Tarjima
              </span>
            </button>

            {/* Download Dropdown */}
            <div ref={exportDropdownRef} className="relative group/dl">
              <button
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="group flex items-center gap-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm border border-slate-200 dark:border-slate-700 rounded-full h-10 px-2.5 hover:px-4 text-slate-400 hover:text-emerald-500 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300 ease-out cursor-pointer"
              >
                <FileDown className="w-4 h-4 flex-none" />
                <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] group-hover:ml-2 transition-all duration-300 whitespace-nowrap text-sm font-medium opacity-0 group-hover:opacity-100">
                  Yuklash
                </span>
              </button>

              {isExportOpen && (
                <div className="absolute top-full right-0 mt-2 flex flex-col w-36 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 p-1 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    onClick={() => handleExport("word")}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    Word (.doc)
                  </button>
                  <button
                    onClick={() => handleExport("pdf")}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5 text-red-500" />
                    PDF
                  </button>
                  <button
                    onClick={() => handleExport("txt")}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    TXT
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Action Deck (Fixed Bottom) */}
      <div className="flex-none bg-linear-to-br from-white via-emerald-50/30 to-teal-50/40 dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 border-t border-emerald-100/50 dark:border-emerald-900/30 shadow-[0_-8px_32px_-8px_rgba(16,185,129,0.15)] dark:shadow-[0_-8px_32px_-8px_rgba(16,185,129,0.25)] backdrop-blur-xl z-20 rounded-t-3xl pb-safe relative">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-transparent via-emerald-500/5 to-transparent pointer-events-none"></div>

        {/* Media Zone */}
        <div className="h-24 px-6 py-2 flex items-center justify-center relative z-10">
          {appState === "REVIEW" && (audioBlob || audioUrl) ? (
            <AudioPlayer
              audioBlob={audioBlob}
              audioUrl={audioUrl}
              onReset={handleResetRequest}
            />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Visualizer */}
              <AudioVisualizer
                stream={streamRef.current}
                isRecording={appState === "RECORDING"}
                audioBlob={audioBlob}
                isPlaying={false}
              />
              {/* Timer Overlay */}
              {appState === "RECORDING" && (
                <div className="absolute top-2 right-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full shadow-sm backdrop-blur-sm border border-emerald-200/50 dark:border-emerald-800/50">
                  {formatDuration(recordingDuration)}
                </div>
              )}
              {appState === "PROCESSING" && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-md z-10 rounded-2xl">
                  <span className="text-emerald-500 text-sm font-mono animate-pulse">
                    Qayta ishlanmoqda...
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Control Zone */}
        <div className="h-24 flex items-center justify-center gap-8 pb-6 relative z-10">
          {/* Upload Button with Dropdown */}
          <div ref={uploadDropdownRef} className="relative group/upload z-50">
            <button
              onClick={() => setIsUploadDropdownOpen(!isUploadDropdownOpen)}
              className="group p-4 text-slate-400 hover:text-emerald-500 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:shadow-emerald-500/20 dark:hover:shadow-emerald-500/30 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:border-emerald-300/50 dark:hover:border-emerald-700/50 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              title="Fayl yuklash"
              disabled={appState === "RECORDING"}
            >
              <UploadCloud className="w-6 h-6 transition-transform group-hover:scale-110" />
            </button>

            {isUploadDropdownOpen && (
              <div className="absolute bottom-full right-0 mb-2 flex flex-col w-36 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 p-1 animate-in fade-in zoom-in-95 duration-200 z-50">
                <button
                  onClick={() => {
                    setSelectedFileType("audio");
                    setIsUploadDropdownOpen(false);
                    setTimeout(() => fileInputRef.current?.click(), 0);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <Mic className="w-4 h-4 text-emerald-500" />
                  Audio
                </button>
                <button
                  onClick={() => {
                    setSelectedFileType("video");
                    setIsUploadDropdownOpen(false);
                    setTimeout(() => fileInputRef.current?.click(), 0);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <Video className="w-4 h-4 text-emerald-500" />
                  Video
                </button>
                <button
                  onClick={() => {
                    setSelectedFileType("image");
                    setIsUploadDropdownOpen(false);
                    setTimeout(() => fileInputRef.current?.click(), 0);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-500" />
                  Rasm
                </button>
              </div>
            )}
          </div>

          {/* Main Mic */}
          <MicButton
            isRecording={appState === "RECORDING"}
            isProcessing={appState === "PROCESSING"}
            onClick={appState === "RECORDING" ? stopRecording : startRecording}
          />

          {/* New Chat Button */}
          <button
            onClick={handleNewConversation}
            className="group p-4 text-slate-400 hover:text-emerald-500 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:shadow-emerald-500/20 dark:hover:shadow-emerald-500/30 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:border-emerald-300/50 dark:hover:border-emerald-700/50 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            title="Yangi suhbat"
            disabled={appState === "RECORDING" || isCreatingNewChat}
          >
            {isCreatingNewChat ? (
              <div className="w-6 h-6 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin"></div>
            ) : (
              <Plus className="w-6 h-6 transition-transform group-hover:rotate-90" />
            )}
          </button>
        </div>
      </div>

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={savedSessions}
        onSelectSession={handleLoadSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* Summary Modal */}
      <SummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        summary={summaryText}
        isLoading={isSummarizing}
        onChat={handleChat}
      />

      {/* Translation Modal */}
      <TranslationModal
        isOpen={isTranslationOpen}
        onClose={() => setIsTranslationOpen(false)}
        translatedText={translatedText}
        isLoading={isTranslating}
        activeLang={translationLang}
        onLanguageChange={handleTranslate}
      />

      {/* Confirm Reset Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          // Confirming the "Return" action implies DISCARDING without saving
          executeReset(false).then(() =>
            setToastMessage("Joriy natijalar o'chirildi")
          );
        }}
        title="Ovoz va Matnni o'chirish"
        message="Haqiqatan ham qaytmoqchimisiz? Joriy yozuv va matn saqlanmaydi va o'chib ketadi."
      />

      {/* Delete Session Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setDeleteSessionId(null);
        }}
        onConfirm={() => {
          confirmDeleteSession();
          setIsDeleteConfirmOpen(false);
          setDeleteSessionId(null);
        }}
        title="Suhbatni o'chirish"
        message="Ushbu suhbatni butunlay o'chirib tashlamoqchimisiz? Bu amalni bekor qilib bo'lmaydi."
      />

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={async () => {
          await authService.logout();
          window.location.href = "/auth";
        }}
        title="Tizimdan chiqish"
        message="Haqiqatan ham tizimdan chiqmoqchimisiz?"
      />
    </div>
  );
};

export default Home;
