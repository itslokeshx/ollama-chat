<div align="center">

<img src="public/icon.png" alt="Ollama Chat" width="80" height="80" />

# Ollama Chat

**A native Linux desktop UI for Ollama — under 10MB, no Docker, no Node.js, no nonsense.**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Tauri 2.0](https://img.shields.io/badge/Tauri-2.0-orange?logo=tauri)](https://tauri.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev)
[![Platform](https://img.shields.io/badge/platform-Linux-lightgrey?logo=linux)](https://github.com/itslokeshx/ollama-chat/releases)
[![Size](https://img.shields.io/badge/install%20size-%3C10MB-brightgreen)](#-installation)

[**⬇ Download .deb**](#-installation) · [Features](#-features) · [Screenshots](#-screenshots) · [Why I built this](#-why-i-built-this)

</div>

---

## 🤔 Why I built this

If you use Ollama on Linux, you already know the pain.

You install Ollama, pull a model, and then... you're stuck in a terminal forever. Want to switch models? Remember the command. Want to upload an image? Good luck. Want a proper chat interface like Claude or ChatGPT? Here's what your options look like:

| Option | Problem |
|--------|---------|
| Open WebUI | Requires Docker. Pulls 500MB+ of images. Needs a daemon running. |
| Hollama, Lobe Chat | Node.js server + npm install. Heavy. Not a real app. |
| Msty, Jan | 200–400MB Electron apps. Overkill for just talking to a local model. |
| Browser extensions | Limited. Can't do file uploads properly. |
| Just use the CLI | You're basically writing JSON by hand at that point. |

None of these feel like **software**. They feel like workarounds.

So I built Ollama Chat — a proper native desktop app for Linux, packaged as a `.deb` you double-click and install. It shows up in your application menu. It launches in one click. It's **under 10MB**. No Docker. No Node.js runtime. No terminal left open in the background. Just an app.

---

## ⬇ Installation

### One-click install (recommended)

**[⬇ Download ollama-chat_1.0.0_amd64.deb](https://github.com/itslokeshx/ollama-chat/releases/latest/download/ollama-chat_1.0.0_amd64.deb)**

Double-click the downloaded `.deb` file in your file manager, or install via terminal:

```bash
sudo dpkg -i ollama-chat_1.0.0_amd64.deb
```

That's it. Find **Ollama Chat** in your application menu and launch it.

> **Prerequisite:** [Ollama](https://ollama.com) must be installed and running (`ollama serve`).

---

## ✨ Features

### 💬 Chat
- Real-time streaming responses — token by token, just like Claude or ChatGPT
- Full markdown rendering — code blocks, tables, bold, italics, all of it
- Syntax highlighting for 100+ languages
- Edit sent messages and regenerate responses
- Copy any message or code block with one click
- Multiple conversations with full history, saved locally

### 🤖 Models
- See all your installed models at a glance
- Smart model selector with **tier grouping** — Frontier (70B+), Balanced (7–34B), Efficient (<7B)
- Capability badges — `vision` `tools` `thinking` `cloud` per model
- Pull new models from inside the app with a live progress bar
- Delete models you no longer need
- Full model info panel — parameters, context length, quantization, size
- **Cloud model support** — use Ollama's hosted models when signed in

### 📎 Files & Images
- Attach images — works with any vision-capable model (LLaVA, Qwen2-VL, LLaMA3.2-Vision, etc.)
- Attach text files, code, PDFs — content injected cleanly into context
- Drag and drop files anywhere on the window
- Paste images directly from clipboard
- Full-screen lightbox for image previews

### ⚙️ Settings & Customization
- System prompt presets — Engineer, Writer, Analyst, Terminal, Concise
- Fine-tune temperature, top_p, top_k, max tokens, keep_alive
- Light / Dark / System theme
- Adjustable font size
- Ollama host URL configurable — works with remote Ollama instances too
- Export conversations as Markdown or JSON

### 🖥️ Native Desktop
- Installs as a real `.deb` package — shows up in your app menu
- Custom titlebar with native window controls
- Under 10MB installed
- No Docker, no Node.js, no background server processes
- Works offline (for local models)

---

## 🖼 Screenshots

> *(Add screenshots here once the app is running)*

---

## 🚀 Getting started

### 1. Install Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Pull a model

```bash
# Good starting model — fast, smart, 2GB
ollama pull llama3.2

# If you want vision support
ollama pull llava
```

### 3. Install Ollama Chat

**[⬇ Download the .deb](https://github.com/itslokeshx/ollama-chat/releases/latest/download/ollama-chat_1.0.0_amd64.deb)**

```bash
sudo dpkg -i ollama-chat_1.0.0_amd64.deb
```

### 4. Launch

Find **Ollama Chat** in your application menu, or run:

```bash
ollama-chat
```

---

## 🛠 Tech stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Desktop runtime | [Tauri 2.0](https://tauri.app) | Rust-based, tiny binary, real native window |
| Frontend | React 18 + TypeScript | Type-safe, component-driven UI |
| Styling | Tailwind CSS v4 + Radix UI | Accessible, themeable, fast |
| State | Zustand | Simple, no boilerplate |
| Build | Vite 5 | Fast dev, optimized production output |
| Packaging | `.deb` + `.AppImage` | Native Linux install |

Tauri is the key ingredient here. Unlike Electron which bundles a full Chromium + Node.js runtime (hence 150–300MB apps), Tauri uses the system's existing WebKit renderer and a Rust backend. The result is a real native app that's a fraction of the size.

---

## 🏗 Build from source

```bash
# Prerequisites: Node.js 18+, Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Clone
git clone https://github.com/itslokeshx/ollama-chat
cd ollama-chat

# Install JS dependencies
npm install

# Dev mode (opens native window with hot reload)
npm run tauri dev

# Production build
npm run tauri build
# Output: src-tauri/target/release/bundle/deb/
```


## 🤝 Contributing

PRs welcome. If you're a Linux + Ollama user who's been frustrated by the lack of a proper UI — you know exactly what this needs. Open an issue or just send a PR.

---

## 📄 License

MIT — do whatever you want with it.

---

<div align="center">

Built for Linux users who just want a proper UI for their local AI.

**[⬇ Download .deb](https://github.com/itslokeshx/ollama-chat/releases/latest/download/ollama-chat_1.0.0_amd64.deb)** · **[itslokeshx](https://github.com/itslokeshx)**

</div>
```
