# Ollama Chat

<p align="center">
  <img src="https://img.shields.io/badge/Ollama-Ready-2ea44f?style=flat-square" alt="Ollama">
  <img src="https://img.shields.io/badge/Platform-Windows%20|%20Linux%20|%20macOS-4ea44f?style=flat-square" alt="Platform">
  <img src="https://img.shields.io/badge/License-MIT-red?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178c6?style=flat-square" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tauri-2.0-ffc107?style=flat-square" alt="Tauri">
</p>

> A beautiful, feature-rich desktop application for chatting with local AI models powered by [Ollama](https://ollama.com). Supports both local models and cloud model integrations with a modern, responsive UI.

![Ollama Chat Screenshot](public/screenshot.png)

## ✨ Features

### 🤖 Model Management

- **Browse Available Models** — View all installed local models with detailed information
- **Model Information Panel** — See parameters, templates, and model details
- **Pull/Delete Models** — Download new models or remove unused ones with progress tracking
- **Cloud Model Support** — Access cloud-hosted models alongside local ones

### 💬 Chat Experience

- **Streaming Responses** — Real-time token-by-token responses from models
- **Markdown Rendering** — Beautiful code blocks, syntax highlighting, and formatted output
- **File Attachments** — Attach images, PDFs, and text files to conversations
- **Vision Model Support** — Chat about images with supported vision models (LLaVA, BakLLaVA, Moondream, etc.)
- **Lightbox Viewer** — View attached images in a full-screen modal
- **Conversation Management** — Create, rename, delete, and organize multiple chat threads
- **Auto-Scroll** — Smooth automatic scrolling as new messages appear

### ⚙️ Customization

- **System Prompt Presets** — Quick-start with presets like "Senior Software Engineer", "Concise Assistant", "Creative Writer", "Linux Terminal", and "Data Analyst"
- **Advanced Parameters** — Fine-tune temperature, top_p, top_k, max_tokens, and keep_alive
- **Theme Support** — Light, dark, or system-preference theme
- **Font Size** — Adjustable text size (small, medium, large)
- **Keyboard Shortcuts** — Send messages with Enter, smart enter/exit behavior

### 🔐 Authentication

- **Ollama Account Integration** — Sign in with your Ollama account for cloud model access
- **Secure API Key Storage** — Safely store and manage your API credentials

### 🖥️ Desktop Features

- **Native Window Controls** — Minimize, maximize, and close with standard window decorations
- **Cross-Platform** — Works on Windows, Linux, and macOS
- **Offline Detection** — Gracefully handles when Ollama is not running

## 🚀 Quick Start

### Prerequisites

- [Ollama](https://ollama.com) installed and running
- Node.js 18+ (for development)
- Rust toolchain (for desktop build)

### Development

```bash
# Clone the repository
git clone https://github.com/yourusername/ollama-chat.git
cd ollama-chat

# Install dependencies
npm install

# Start development server
npm run dev
```

### Desktop Build

```bash
# Install Rust dependencies
cargo install

# Build the desktop application
npm run tauri build
```

The built executable will be in `src-tauri/target/release/bundle/`.

### Usage

1. **Start Ollama** on your machine:

   ```bash
   ollama serve
   ```

2. **Launch Ollama Chat** — The app connects to `http://localhost:11434` by default

3. **Configure** — Click the settings icon to adjust the Ollama host URL if needed

4. **Select a Model** — Choose from available local models or cloud models in the model selector

5. **Start Chatting** — Type your message and press Enter to send

## 📁 Project Structure

```
ollama-chat/
├── public/                  # Static assets
├── src/
│   ├── components/
│   │   ├── chat/           # Chat-specific components
│   │   │   ├── AccountWidget.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── FileChip.tsx
│   │   │   ├── InputArea.tsx
│   │   │   ├── LightboxModal.tsx
│   │   │   ├── MarkdownMessage.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ModelBrowser.tsx
│   │   │   ├── ModelInfoPanel.tsx
│   │   │   ├── ModelSelectorPopover.tsx
│   │   │   ├── SettingsModal.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── SignInModal.tsx
│   │   │   └── SystemPromptPanel.tsx
│   │   └── ui/             # Reusable UI components (Radix-based)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Core utilities
│   │   ├── ollama.ts        # Ollama API client
│   │   ├── types.ts         # TypeScript interfaces
│   │   ├── cloud-models.ts  # Cloud model definitions
│   │   ├── file-utils.ts    # File handling utilities
│   │   ├── model-utils.ts   # Model-related helpers
│   │   ├── markdown.ts      # Markdown processing
│   │   ├── time-utils.ts    # Time formatting
│   │   └── utils.ts         # General utilities
│   ├── pages/
│   │   └── ChatPage.tsx     # Main chat page
│   ├── store/
│   │   ├── auth-store.ts    # Authentication state (Zustand)
│   │   └── chat-store.ts    # Chat/conversation state (Zustand)
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── src-tauri/               # Tauri/Rust backend
│   ├── src/
│   │   ├── lib.rs           # Library code
│   │   └── main.rs          # Application entry
│   ├── Cargo.toml           # Rust dependencies
│   └── tauri.conf.json      # Tauri configuration
├── components.json          # shadcn/ui component config
├── package.json             # Node dependencies
├── tsconfig.json            # TypeScript config
└── vite.config.ts          # Vite bundler config
```

## 🛠️ Tech Stack

| Layer                | Technology                                                                         |
| -------------------- | ---------------------------------------------------------------------------------- |
| **Desktop Runtime**  | [Tauri](https://tauri.app/) 2.0                                                    |
| **Frontend**         | [React](https://react.dev/) 18 + [TypeScript](https://www.typescriptlang.org/) 5.5 |
| **Build Tool**       | [Vite](https://vitejs.dev/) 5                                                      |
| **Styling**          | [Tailwind CSS](https://tailwindcss.com/) 4 + [Radix UI](https://radix-ui.com/)     |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/)                                           |
| **HTTP Client**      | Native Fetch API                                                                   |
| **AI Integration**   | [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md)               |

## 📋 System Prompt Presets

| Preset                       | Description                                                           |
| ---------------------------- | --------------------------------------------------------------------- |
| **Default Assistant**        | Standard helpful assistant behavior                                   |
| **Senior Software Engineer** | Clean, documented, production-ready code with edge case consideration |
| **Concise**                  | Brief, direct answers with no fluff                                   |
| **Creative Writer**          | Vivid, literary writing with metaphor and sensory detail              |
| **Linux Terminal**           | Simulates a Linux shell environment                                   |
| **Data Analyst**             | Structured data analysis with tables and statistics                   |

## 🔧 Configuration Options

| Setting       | Default                  | Description                |
| ------------- | ------------------------ | -------------------------- |
| `ollamaHost`  | `http://localhost:11434` | Ollama API endpoint        |
| `temperature` | `0.7`                    | Response randomness (0-1)  |
| `topP`        | `0.9`                    | Nucleus sampling threshold |
| `topK`        | `40`                     | Top-k vocabulary filtering |
| `maxTokens`   | `2048`                   | Maximum response length    |
| `keepAlive`   | `5m`                     | Model memory persistence   |
| `theme`       | `system`                 | Light, dark, or system     |
| `fontSize`    | `md`                     | Small, medium, or large    |

## 📦 Supported Vision Models

The following model families support image attachments:

- LLaVA & LLaVA-Llama3
- BakLLaVA
- Moondream
- CogVLM
- LLaMA3.2-Vision
- MiniCPM-V
- Qwen2-VL
- Falcon2
- Granite3
- Pixtral
- InternVL
- Obsidian

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Ollama](https://ollama.com) for making local AI accessible
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Tauri](https://tauri.app/) for the lightweight desktop framework
