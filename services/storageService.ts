import { SavedSession } from "../types";
import api from "./api";

export class StorageService {
  // Backendga sessiyani saqlash
  async saveSession(session: SavedSession): Promise<void> {
    try {
      const formData = new FormData();
      formData.append("text", session.text);
      formData.append("duration", session.duration.toString());

      if (session.audioBlob) {
        // Blob ni fayl sifatida qo'shish
        formData.append("audioBlob", session.audioBlob, "recording.webm");
      }

      // Backendga yuborish
      await api.post("/sessions", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (error: any) {
      console.error(
        "Failed to save session to backend:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Backenddan sessiyalarni olish
  async getSessions(): Promise<SavedSession[]> {
    try {
      const response = await api.get("/sessions");
      const sessions = response.data.data; // Backend paginated response: { data: [], meta: {} }

      return sessions.map((s: any) => ({
        id: s.id,
        text: s.text,
        audioBlob: null, // Blobni darhol yuklamaymiz, URL ishlatamiz
        audioUrl: s.audioUrl
          ? `${api.defaults.baseURL}/sessions/${s.id}/audio`
          : null,
        timestamp: new Date(s.createdAt).getTime(),
        duration: s.duration,
      }));
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      return [];
    }
  }

  // Sessiyani o'chirish
  async deleteSession(id: string): Promise<void> {
    try {
      await api.delete(`/sessions/${id}`);
    } catch (error) {
      console.error("Failed to delete session:", error);
      throw error;
    }
  }
}

export const storageService = new StorageService();
