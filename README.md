# J.A.R.V.I.S. — AI Desktop & Web HUD Assistant

A complete Tony Stark-inspired J.A.R.V.I.S. system featuring:
1. **Next-Gen Web HUD (React / TypeScript / Vite / Tailwind)** with animated Arc Reactor, voice synthesis, multi-palette theme engine, tone modulation, message search, and conversation summarizer.
2. **Desktop & Cloud Daemon (Python / Streamlit / LangChain / Groq)** with hands-free Windows wake-words, WhatsApp automation, safe PC control, and memory module.

---

## 🌟 Web HUD Features (React + TypeScript)

| Feature | Description |
|---|---|
| **Arc Reactor Interface** | High-fidelity pulsing Arc Reactor with counter-rotating rings and speaking wave animations |
| **Theme Selector** | Dynamic HUD palettes: *Classic Cyan*, *Mark 85 Stark Red*, *Arc Gold*, *Stealth Obsidian*, and *Emerald Green* |
| **Tone Modulation** | Adjust JARVIS's demeanor on the fly: *Formal*, *Casual*, *Sarcastic* (Tony Stark banter), or *Tactical* |
| **Message Search Bar** | Real-time query filtering across previous queries, system alerts, and J.A.R.V.I.S. responses |
| **Conversation Summarizer** | Instant executive briefing synthesizing conversation history via LLM into persistent memory |
| **Hands-Free Wake Word** | Web Speech API listener: say *"Hello JARVIS"* (or Hindi *"जार्विस"*) to activate |
| **Voice Synthesis** | Web Speech Synthesis with British (Avengers Daniel), UK/US, and Hindi voice presets |
| **Safe Calculator** | Math evaluator with support for trigonometry, powers, logarithms, and constants |
| **Live Web & Wikipedia** | Real encyclopedic search and knowledge retrieval |
| **Durable Memory Banks** | Long-term memory store (`~/.jarvis/memory.json`) injected automatically into prompt context |
| **Follow-up Reminders** | Natural time parser (*"in 10 minutes"*, *"tomorrow 9am"*) with live audio alerts |
| **Sandboxed PC Control** | Safe folder explorer (Documents, Desktop, Downloads) & allowed apps launcher |
| **Communications Suite** | Read-only IMAP email inspector and WhatsApp messaging simulation |
| **Vision Analysis** | Image and schematic inspection buffer |

### Running the Web HUD

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build production bundle
npm run build
```

---

## 🖥 Desktop Daemon & Tools (Python)

Built with **Python · Streamlit · LangChain · Groq**.

### Capabilities
- **Web search** (DuckDuckGo) & **Wikipedia**
- **Safe Calculator & Time parser**
- **Offline Windows Wake Word** (*"Hello JARVIS"* / *"Hey JARVIS"*)
- **WhatsApp Web & Meta Cloud API automation**
- **Sandboxed PC Control** (open allowed apps, list files, create notes)
- **Email Inspector** (strictly read-only IMAP)
- **Vision** (Gemini API for screen and image analysis)

### Running the Python Desktop App
```bash
# Windows quick-start
run.bat
# Or desktop native window
run_desktop.bat
```

---

## 🔑 Environment Setup

Copy `.env.example` to `.env` and fill in your keys:
```bash
GROQ_API_KEY=gsk_your_key_here
GEMINI_API_KEY=your_gemini_key_here
```
