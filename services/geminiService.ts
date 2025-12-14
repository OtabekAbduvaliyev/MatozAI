import {
  GoogleGenAI,
  LiveServerMessage,
  Modality,
  Blob as GenAIBlob,
} from "@google/genai";

interface GeminiServiceCallbacks {
  onOpen: () => void;
  onTranscriptionUpdate: (text: string, isFinal: boolean) => void;
  onError: (error: Error) => void;
  onClose: () => void;
}

export class GeminiService {
  private ai: GoogleGenAI;
  private session: any = null;
  private inputAudioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  // BUFFERING LOGIC to fix "Skipping Words"
  private transcriptionBuffer: string = "";

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY,
    });
  }

  // --- LIVE STREAMING ---

  async connect(stream: MediaStream, callbacks: GeminiServiceCallbacks) {
    try {
      this.transcriptionBuffer = "";

      // Use 16kHz for native compatibility and speed
      this.inputAudioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });

      if (this.inputAudioContext.state === "suspended") {
        await this.inputAudioContext.resume();
      }

      const clonedStream = stream.clone();
      this.source =
        this.inputAudioContext.createMediaStreamSource(clonedStream);
      this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

      let sessionPromise: Promise<any>;

      const config = {
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        callbacks: {
          onopen: () => {
            callbacks.onOpen();
            this.startAudioStreaming(sessionPromise);
          },
          onmessage: (message: LiveServerMessage) => {
            // 1. Capture streaming text
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              if (text) {
                // Update buffer continuously
                this.transcriptionBuffer += text;
                // Send "Live" update
                callbacks.onTranscriptionUpdate(
                  this.transcriptionBuffer,
                  false
                );
              }
            }

            // 2. Commit on Turn Complete (The Pause)
            if (message.serverContent?.turnComplete) {
              if (this.transcriptionBuffer.trim()) {
                // Send "Final" update with the full buffer
                callbacks.onTranscriptionUpdate(this.transcriptionBuffer, true);
                // Clear buffer for next phrase
                this.transcriptionBuffer = "";
              }
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error("Gemini Service Error:", e);
            callbacks.onError(new Error("Connection error"));
          },
          onclose: (e: CloseEvent) => {
            callbacks.onClose();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          systemInstruction: `
            Role: Precise Uzbek Transcriber.
            Task: Output verbatim text.
            Rules:
            1. No chatting. No headers. No filler.
            2. Punctuate logically.
            3. Use official Uzbek Latin script.
            4. Keep output streaming continuous.
          `,
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE",
            },
          ],
        },
      };

      sessionPromise = this.ai.live.connect(config);
      this.session = await sessionPromise;
    } catch (error) {
      console.error("Failed to connect:", error);
      callbacks.onError(
        error instanceof Error ? error : new Error("Unknown error")
      );
    }
  }

  private startAudioStreaming(sessionPromise: Promise<any>) {
    if (!this.inputAudioContext || !this.processor || !this.source) return;

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createBlob(inputData);

      sessionPromise.then((session) => {
        try {
          session.sendRealtimeInput({ media: pcmBlob });
        } catch (err) {
          // Ignore send errors if session is closed
        }
      });
    };

    this.source.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  disconnect() {
    if (this.processor && this.source) {
      this.processor.disconnect();
      this.source.disconnect();
    }

    if (this.inputAudioContext) {
      this.inputAudioContext.close();
    }

    if (this.session) {
      try {
        this.session.close();
      } catch (e) {
        console.error("Error closing session:", e);
      }
    }

    this.session = null;
    this.source = null;
    this.processor = null;
    this.inputAudioContext = null;
    this.transcriptionBuffer = "";
  }

  // --- STATIC FILE FEATURES (Upload & Summary) ---

  async transcribeAudioFile(audioBlob: Blob): Promise<string> {
    try {
      const base64Audio = await blobToBase64(audioBlob);

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash", // Use standard Flash for file processing
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: audioBlob.type,
                data: base64Audio,
              },
            },
            {
              text: "Transcribe this audio verbatim in Uzbek. Use official Latin script. Do not add timestamps or speaker labels. Just the text.",
            },
          ],
        },
      });

      return response.text || "";
    } catch (error) {
      console.error("File Transcription Error:", error);
      throw error;
    }
  }

  async transcribeVideoFile(videoBlob: Blob): Promise<string> {
    try {
      const base64Video = await blobToBase64(videoBlob);

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: videoBlob.type,
                data: base64Video,
              },
            },
            {
              text: "Extract and transcribe all spoken words from this video. Use Uzbek Latin script if Uzbek is spoken. If other languages are spoken, transcribe in that language. Do not add timestamps or speaker labels. Just output the transcription text.",
            },
          ],
        },
      });

      return response.text || "";
    } catch (error) {
      console.error("Video Transcription Error:", error);
      throw error;
    }
  }

  async extractTextFromImage(imageBlob: Blob): Promise<string> {
    try {
      const base64Image = await blobToBase64(imageBlob);

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: imageBlob.type,
                data: base64Image,
              },
            },
            {
              text: "Extract all visible text from this image. If the text is in Uzbek, use Latin script. Preserve the original formatting and structure as much as possible. Output only the extracted text, nothing else.",
            },
          ],
        },
      });

      return response.text || "";
    } catch (error) {
      console.error("Image Text Extraction Error:", error);
      throw error;
    }
  }

  async summarizeText(text: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            {
              text: `Quyidagi matnni o'zbek tilida qisqacha xulosa qilib ber (Summarize this text in Uzbek). Asosiy fikrlarni bullet pointlar orqali yoz:\n\n${text}`,
            },
          ],
        },
      });
      return response.text || "";
    } catch (error) {
      console.error("Summary Error:", error);
      throw error;
    }
  }

  async translateText(text: string, targetLang: "en" | "ru"): Promise<string> {
    try {
      const prompt =
        targetLang === "en"
          ? "Translate the following Uzbek text to English. Output only the translation:"
          : "Translate the following Uzbek text to Russian. Output only the translation:";

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [{ text: `${prompt}\n\n${text}` }],
        },
      });
      return response.text || "";
    } catch (error) {
      console.error("Translation Error:", error);
      throw error;
    }
  }

  async chat(
    context: string,
    history: { role: "user" | "ai"; content: string }[],
    newMessage: string
  ): Promise<string> {
    try {
      // Construct the chat history for Gemini
      // System instructions or Context setting
      const contents = [
        {
          role: "user",
          parts: [
            {
              text: `Quyidagi matn asosida savollarga javob ber (Answer questions based on the following text). Javoblar o'zbek tilida bo'lsin: \n\n${context}`,
            },
          ],
        },
        {
          role: "model",
          parts: [
            { text: "Tushunarli. Matn bo'yicha savollaringizni bering." },
          ],
        },
      ];

      // Append history (Limit to last 10 messages to save tokens)
      const recentHistory = history.slice(-10);
      recentHistory.forEach((msg) => {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        });
      });

      // Append new message
      contents.push({
        role: "user",
        parts: [{ text: newMessage }],
      });

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
      });

      return response.text || "";
    } catch (error) {
      console.error("Chat Error:", error);
      throw error;
    }
  }
}

// --- UTILS ---

function createBlob(data: Float32Array): GenAIBlob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: "audio/pcm;rate=16000",
  };
}

function encode(bytes: Uint8Array) {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // Remove "data:audio/xyz;base64," prefix
      const base64 = dataUrl.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
