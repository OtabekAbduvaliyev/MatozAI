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
} from "lucide-react";
import { formatDuration } from "./utils/audioUtils";
import { exportToPdf, exportToWord } from "./utils/exportUtils";
import { GeminiService } from "./services/geminiService";
import { storageService } from "./services/storageService";
import { Script } from "./utils/transliteration";
import { SavedSession } from "./types";
import { authService } from "./services/authService";
import { socketService } from "./services/socketService";
import AuthScreen from "./components/AuthScreen";

type AppState = "IDLE" | "RECORDING" | "PROCESSING" | "REVIEW";
type Theme = "light" | "dark";

// Local storage key for PREFERENCES only, data goes to IndexedDB
const PREFS_KEY = "matozai_prefs_v1";

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    authService.isAuthenticated()
  );
  const [appState, setAppState] = useState<AppState>("IDLE");
  const [script, setScript] = useState<Script>("lat");
  const [theme, setTheme] = useState<Theme>("dark");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);

  // Summarizer State
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);

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

  // Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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

  // 1. Initialize & Load Prefs & Socket
  useEffect(() => {
    if (!isAuthenticated) return;

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
  }, [isAuthenticated]);

  // Toast Timer
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

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
        // Clear translation cache as source text changed
        setTranslationCache({});
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

    if (file.size > 20 * 1024 * 1024) {
      alert("Fayl hajmi juda katta (maks 20MB)");
      return;
    }

    executeReset(false); // Clear previous without saving

    setAppState("PROCESSING");
    setToastMessage("Fayl yuklanmoqda...");
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
        setToastMessage("Fayl matnga aylantirildi");
      })
      .catch((err) => {
        console.error(err);
        alert("Faylni o'qishda xatolik yuz berdi");
        setAppState("IDLE");
      });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSummarize = async () => {
    if (!fullText.trim()) return;
    setIsSummaryOpen(true);
    setIsSummarizing(true);
    setSummaryText("");

    try {
      const summary = await geminiService.current.summarizeText(fullText);
      setSummaryText(summary);
    } catch (err) {
      setSummaryText("Xulosa qilishda xatolik yuz berdi.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleTranslate = async (lang: "en" | "ru") => {
    if (!fullText.trim()) return;

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

  const handleExport = (type: "pdf" | "word") => {
    if (!fullText.trim()) return;
    if (type === "pdf") {
      exportToPdf(fullText);
    } else {
      exportToWord(fullText);
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
    setSavedSessions((prev) => prev.filter((s) => s.id !== id));

    try {
      await storageService.deleteSession(id);
      refreshHistory();
    } catch (err) {
      console.error("Delete failed", err);
      refreshHistory();
    }
  };

  const handleManualTextChange = (newText: string) => {
    setFullText(newText);
    committedTextRef.current = newText;
    setTranslationCache({}); // Invalidate cache
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
  };

  const handleNewConversation = () => {
    // New conversation implies saving the old one automatically
    if (fullText || audioBlob) {
      executeReset(true).then(() =>
        setToastMessage("Yangi suhbat boshlandi (Avtomatik saqlandi)")
      );
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

  if (!isAuthenticated) {
    return <AuthScreen onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

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
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            MatozAI
          </h1>
          <button
            onClick={() => setScript((s) => (s === "lat" ? "cyr" : "lat"))}
            className="px-2 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors"
          >
            {script === "lat" ? "LOTIN" : "КИРИЛЛ"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            hidden
            accept="audio/*"
            onChange={handleFileUpload}
          />

          <button
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            className="p-2 text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
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
            className="p-2 text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Tarix"
          >
            <History className="w-5 h-5" />
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
              className="group flex items-center gap-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm border border-slate-200 dark:border-slate-700 rounded-full h-10 px-2.5 hover:px-4 text-slate-400 hover:text-emerald-500 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300 ease-out"
            >
              <Copy className="w-4 h-4 flex-none" />
              <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] group-hover:ml-2 transition-all duration-300 whitespace-nowrap text-sm font-medium opacity-0 group-hover:opacity-100">
                Nusxalash
              </span>
            </button>

            <button
              onClick={handleSummarize}
              className="group flex items-center gap-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm border border-slate-200 dark:border-slate-700 rounded-full h-10 px-2.5 hover:px-4 text-slate-400 hover:text-emerald-500 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300 ease-out"
            >
              <Sparkles className="w-4 h-4 flex-none" />
              <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] group-hover:ml-2 transition-all duration-300 whitespace-nowrap text-sm font-medium opacity-0 group-hover:opacity-100">
                Xulosa
              </span>
            </button>

            <button
              onClick={() => handleTranslate("en")}
              className="group flex items-center gap-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm border border-slate-200 dark:border-slate-700 rounded-full h-10 px-2.5 hover:px-4 text-slate-400 hover:text-emerald-500 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300 ease-out"
            >
              <Languages className="w-4 h-4 flex-none" />
              <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] group-hover:ml-2 transition-all duration-300 whitespace-nowrap text-sm font-medium opacity-0 group-hover:opacity-100">
                Tarjima
              </span>
            </button>

            {/* Download Dropdown */}
            <div className="relative group/dl">
              <button
                onClick={() => setIsExportOpen(!isExportOpen)}
                onMouseEnter={() => setIsExportOpen(true)}
                className="group flex items-center gap-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm border border-slate-200 dark:border-slate-700 rounded-full h-10 px-2.5 hover:px-4 text-slate-400 hover:text-emerald-500 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300 ease-out"
              >
                <FileDown className="w-4 h-4 flex-none" />
                <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] group-hover:ml-2 transition-all duration-300 whitespace-nowrap text-sm font-medium opacity-0 group-hover:opacity-100">
                  Yuklash
                </span>
              </button>

              {isExportOpen && (
                <div
                  onMouseLeave={() => setIsExportOpen(false)}
                  className="absolute top-full right-0 mt-2 flex flex-col w-32 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 p-1 animate-in fade-in zoom-in-95 duration-200"
                >
                  <button
                    onClick={() => handleExport("word")}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors text-left"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    Word
                  </button>
                  <button
                    onClick={() => handleExport("pdf")}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors text-left"
                  >
                    <FileDown className="w-3.5 h-3.5 text-red-500" />
                    PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Action Deck (Fixed Bottom) */}
      <div className="flex-none bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.3)] z-20 rounded-t-3xl pb-safe">
        {/* Media Zone */}
        <div className="h-24 px-6 py-2 flex items-center justify-center relative">
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
                <div className="absolute top-2 right-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                  {formatDuration(recordingDuration)}
                </div>
              )}
              {appState === "PROCESSING" && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
                  <span className="text-emerald-500 text-sm font-mono animate-pulse">
                    Qayta ishlanmoqda...
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Control Zone */}
        <div className="h-24 flex items-center justify-center gap-8 pb-6">
          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-emerald-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-full transition-all duration-300"
            title="Ovoz yuklash"
            disabled={appState === "RECORDING"}
          >
            <UploadCloud className="w-6 h-6" />
          </button>

          {/* Main Mic */}
          <MicButton
            isRecording={appState === "RECORDING"}
            isProcessing={appState === "PROCESSING"}
            onClick={appState === "RECORDING" ? stopRecording : startRecording}
          />

          {/* New Chat Button */}
          <button
            onClick={handleNewConversation}
            className="p-3 text-slate-400 hover:text-emerald-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-full transition-all duration-300"
            title="Yangi suhbat"
            disabled={appState === "RECORDING"}
          >
            <Plus className="w-6 h-6" />
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
    </div>
  );
};

export default App;
