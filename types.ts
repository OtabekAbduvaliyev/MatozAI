export interface TranscriptionItem {
  id: string;
  text: string;
  timestamp: Date;
}

export interface CaptionSegment {
  id: string;
  text: string;
  isFinal: boolean;
}

export interface SavedSession {
  id: string;
  text: string;
  audioBlob: Blob | null;
  audioUrl?: string | null;
  timestamp: number;
  duration: number;
}

export enum ConnectionStatus {
  DISCONNECTED = "DISCONNECTED",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  ERROR = "ERROR",
}

export interface AudioConfig {
  sampleRate: number;
}
