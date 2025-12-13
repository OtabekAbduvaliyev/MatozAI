# MatozAI 🇺🇿

<div align="center">

![MatozAI Logo](public/logo.svg)

**Fast, accurate Uzbek voice-to-text application using Gemini Live API**

[![React](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-purple.svg)](https://vitejs.dev/)
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-1.30.0-green.svg)](https://ai.google.dev/)

[Get Started](#-quick-start) • [Features](#-features) • [Installation](#-installation) • [Contributing](#-contributing) • [Support](#-support)

</div>

---

## 📖 What is MatozAI?

MatozAI is a modern, web-based voice transcription application specifically designed for the Uzbek language. Built with cutting-edge Google Gemini AI technology, it provides real-time, highly accurate voice-to-text conversion with advanced features like translation, summarization, and multi-format support.

### 🎯 Key Capabilities

- **Real-time Transcription**: Live voice-to-text conversion using Gemini Live API
- **Multi-format Support**: Process audio, video, and image files
- **Smart Features**: AI-powered summarization and translation
- **Dual Script Support**: Switch between Latin and Cyrillic Uzbek scripts
- **Export Options**: Download transcriptions as PDF or Word documents
- **Session Management**: Save and 回顾 historical transcriptions

---

## ✨ Features

### 🎤 **Voice Recording & Transcription**

- Real-time voice recording with live transcription
- High-quality audio processing with noise suppression
- Visual audio feedback during recording
- Support for microphone input and file uploads

### 📁 **Multi-format File Processing**

- **Audio Files**: WAV, MP3, M4A, and other common formats
- **Video Files**: MP4, AVI, MOV with automatic audio extraction
- **Image Files**: OCR text extraction from images

### 🧠 **AI-Powered Features**

- **Smart Summarization**: Generate concise summaries of transcriptions
- **Translation**: Translate between Uzbek, English, and Russian
- **Script Conversion**: Automatic Latin ↔ Cyrillic script switching

### 📱 **User Experience**

- Clean, intuitive interface with dark/light theme support
- Responsive design for desktop and mobile devices
- Keyboard shortcuts for quick actions
- Session history with search and management

### 💾 **Export & Integration**

- Export to PDF and Word document formats
- Copy to clipboard functionality
- Session persistence and recovery
- Social sharing capabilities

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Google Gemini API key
- Modern web browser with microphone access

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/matozai.git
cd matozai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

> 🔑 **Get your Gemini API key**: Visit [Google AI Studio](https://aistudio.google.com/app/apikey) to generate a free API key.

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for Production

```bash
npm run build
npm run preview
```

---

## 🛠️ Installation

### Development Setup

1. **Clone and Install**

   ```bash
   git clone https://github.com/your-username/matozai.git
   cd matozai
   npm install
   ```

2. **Configure Environment**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API key
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

### Production Deployment

The application is configured for easy deployment on platforms like Vercel:

1. **Build the application**

   ```bash
   npm run build
   ```

2. **Deploy** the `dist` folder to your hosting platform

3. **Set environment variables** in your hosting platform's dashboard

---

## 📋 Usage Examples

### Basic Voice Recording

```typescript
// Start recording
await startRecording();

// The app will automatically transcribe in real-time
// Text appears as you speak

// Stop recording
await stopRecording();

// Transcription is ready for editing, saving, or exporting
```

### File Upload Processing

```typescript
// Upload audio file
handleFileUpload(audioFile);
// ✅ Automatic transcription and processing

// Upload video file
handleFileUpload(videoFile);
// ✅ Audio extracted and transcribed

// Upload image for OCR
handleFileUpload(imageFile);
// ✅ Text extracted from image
```

### AI Features

```typescript
// Generate summary
const summary = await geminiService.summarizeText(fullText);

// Translate to English
const englishText = await geminiService.translateText(uzbekText, "en");

// Switch scripts
setScript(script === "lat" ? "cyr" : "lat");
```

---

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS with dark mode support
- **AI Integration**: Google Gemini 2.5 Flash API
- **Audio Processing**: Web Audio API + MediaRecorder
- **Real-time**: Socket.io for live features
- **Icons**: Lucide React

### Project Structure

```
src/
├── components/          # React components
│   ├── AudioPlayer.tsx     # Audio playback
│   ├── AudioVisualizer.tsx # Real-time audio visualization
│   ├── TranscriptionDisplay.tsx # Text editor with live updates
│   └── ...
├── services/           # API and business logic
│   ├── geminiService.ts    # Gemini AI integration
│   ├── authService.ts      # Authentication
│   └── storageService.ts   # Data persistence
├── utils/              # Helper functions
│   ├── audioUtils.ts       # Audio processing
│   ├── exportUtils.ts      # Document export
│   └── transliteration.ts  # Script conversion
└── types/              # TypeScript definitions
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with proper TypeScript types
4. **Add tests** for new functionality
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Code Style

- Use TypeScript for all new code
- Follow the existing component patterns
- Add proper JSDoc comments for public APIs
- Use TailwindCSS classes consistently
- Write meaningful commit messages

### Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run type-check   # Run TypeScript compiler check
```

---

## 📚 API Reference

### GeminiService

The core service for AI-powered features:

```typescript
class GeminiService {
  // Real-time transcription
  connect(stream, callbacks);
  disconnect();

  // File processing
  transcribeAudioFile(audioBlob);
  transcribeVideoFile(videoBlob);
  extractTextFromImage(imageBlob);

  // AI features
  summarizeText(text);
  translateText(text, targetLang);
}
```

### StorageService

Session and data management:

```typescript
class StorageService {
  saveSession(session);
  getSessions();
  deleteSession(id);
}
```

---

## 🌍 Supported Languages & Scripts

### Primary Language

- **Uzbek** (Oʻzbekcha) - Latin and Cyrillic scripts

### Translation Support

- **English** - Full translation capabilities
- **Russian** - Full translation capabilities

### Audio Formats

- Input: WebM, MP4, WAV, MP3, M4A
- Processing: Real-time streaming + batch processing

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Musayev Doniyor** - _Initial work_ - [@doniyor](https://github.com/doniyor)
- **Abduvaliyev Otabek** - _Initial work_ - [@otabek](https://github.com/otabek)

---

## 🙏 Acknowledgments

- **Google Gemini AI** - For providing powerful language models
- **React Team** - For the excellent frontend framework
- **Vercel** - For seamless deployment infrastructure
- **Uzbek Language Community** - For feedback and testing

---

## 🆘 Support

### Getting Help

- **Documentation**: Check this README and inline code comments
- **Issues**: [GitHub Issues](https://github.com/your-username/matozai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/matozai/discussions)

### Common Issues

**Q: Microphone not working?**
A: Ensure you've granted microphone permissions and are using HTTPS in production.

**Q: API key errors?**
A: Verify your Gemini API key is correctly set in the environment variables.

**Q: Poor transcription accuracy?**
A: Speak clearly, ensure minimal background noise, and check audio input levels.

### Contributing

Found a bug or want to suggest a feature? We'd love to hear from you!

1. Check existing [issues](../../issues) first
2. Create a new issue with detailed description
3. For bugs, include steps to reproduce
4. For features, describe the use case and expected behavior

---

<div align="center">

**Made with ❤️ for the Uzbek language community**

[⬆ Back to Top](#matozai-)

</div>
#   M a t o z - A I  
 #   M a t o z - A I  
 #   M a t o z A I  
 