# 🤖 Sado

<div align="center">

![Sado Banner](/public/logo.svg)

**Next-Gen AI Transcription & Analysis Platform for Uzbek Language**

[![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-purple?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1-cyan?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Powered_by-Gemini_2.0-orange?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)

</div>

---

## 📖 About The Project

**Sado** is a powerful web application designed to bring state-of-the-art AI capabilities to the Uzbek language. It serves as an intelligent assistant that can listen, transcribe, summarize, translate, and even chat about your audio conversations in real-time.

Built with a focus on **speed**, **accuracy**, and **user experience**, Sado leverages Google's **Gemini 2.5 Flash** model to process audio streams natively, ensuring ultra-low latency transcription.

### 🌟 Key Features

- **🎙️ Real-time Transcription**: accurate Speech-to-Text for Uzbek language using native audio streaming.
- **📂 Multi-format Upload**: Support for uploading Audio, Video, and Images for text extraction and analysis.
- **⚡ Instant Summarization**: Get concise summaries of long meetings or recordings with a single click.
- **💬 Contextual AI Chat**: Chat with your transcription! Ask questions, clarify details, or request specific insights based on the recorded text.
- **🌍 Smart Translation**: Instantly translate transcripts between Uzbek (Latin/Cyrillic), English, and Russian.
- **🔁 Script Transliteration**: One-click toggle between Uzbek Latin and Cyrillic scripts.
- **💾 Cloud History**: Securely save your sessions, including audio and text, to the cloud (requires backend).
- **🎨 Modern UI**: Beautiful, responsive interface with Dark/Light mode support and smooth animations.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS 4, Lucide React (Icons)
- **AI Engine**: Google GenAI SDK (Gemini 2.5 Flash Native Audio)
- **State Management**: React Hooks (Context-free simple state for MVP)
- **Networking**: Axios (REST), Socket.io-client (Real-time events)
- **Build Tool**: Vite

---

## 🚀 Getting Started

Follow these steps to get a local copy up and running.

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/yourusername/Sado.git
    cd Sado
    ```

2.  **Install dependencies**

    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory and add your keys:

    ```env
    VITE_GEMINI_API_KEY=your_google_gemini_api_key
    VITE_API_URL=http://localhost:3000/api  # Your Backend URL
    ```

4.  **Run the application**

    ```bash
    npm run dev
    ```

5.  Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🎮 Usage Guide

1.  **Recording**: Click the microphone icon to start recording. The AI will transcribe in real-time.
2.  **Upload**: Use the cloud icon to upload existing Audio, Video, or Image files for processing.
3.  **Chat**: Click "Summary" -> "Chat" to ask questions about the current transcript.
4.  **Translate**: Use the "Translate" button to switch languages.
5.  **History**: Access past sessions from the sidebar (clock icon).

---

## 🔮 Roadmap & Future Features

- [ ] **Action Items**: Automatically extract tasks and to-do lists from meeting transcripts.
- [ ] **Text Polishing**: AI-powered grammar correction and style improvement (removing filler words).
- [ ] **Sentiment Analysis**: Detect the mood and tone of the conversation.
- [ ] **Speaker Diarization**: Distinguish between multiple speakers in a conversation.
- [ ] **Mobile App**: Native mobile experience (React Native).

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  Built with ❤️ for the Uzbek AI Community
</div>
