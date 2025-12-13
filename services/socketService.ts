import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:7070";

class SocketService {
  private socket: Socket | null = null;

  connect() {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    this.socket = io(SOCKET_URL, {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ["websocket"],
    });

    this.socket.on("connect", () => {
      console.log("WebSocket connected");
    });

    this.socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
    });

    this.socket.on("error", (err) => {
      console.error("WebSocket error:", err);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Session events
  joinSession(sessionId: string) {
    this.socket?.emit("join_session", { sessionId });
  }

  leaveSession(sessionId: string) {
    this.socket?.emit("leave_session", { sessionId });
  }

  // Transcription events (if we move logic to backend later)
  sendTranscriptionUpdate(sessionId: string, text: string, isFinal: boolean) {
    this.socket?.emit("transcription_update", { sessionId, text, isFinal });
  }
}

export const socketService = new SocketService();
