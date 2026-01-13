# 🌌 NEXUS-MD WhatsApp Bot

<p align="center">
  <img src="https://telegra.ph/file/your-image-link-here.jpg" alt="NEXUS-MD" width="200"/>
</p>

<p align="center">
  <strong>NEXUS-MD</strong> is a powerful, multi-device WhatsApp bot built from scratch for high performance, group management, and AI-driven automation.
</p>

---

## 🚀 Features & Commands (30+)

### 🛡️ Group Management
- `.tagall` - Mention every member in the group.
- `.hidetag` - Tag everyone invisibly.
- `.kick @user` - Remove a specific member.
- `.add 234...` - Add a member via phone number.
- `.promote @user` - Make a member an admin.
- `.demote @user` - Remove admin privileges.
- `.mute / .unmute` - Lock or unlock the chat.
- `.antilink on/off` - Automatically kick users who send links.
- `.warn @user` - Give a strike; auto-kicks at 3 warnings.
- `.setwelcome` - Set custom welcome messages.
- `.setgoodbye` - Set custom goodbye messages.
- `.poll Question | Opt1 | Opt2` - Create a WhatsApp poll.

### 📥 Media & Downloaders
- `.play [song]` - Download MP3 from YouTube.
- `.video [link]` - Download videos from YT, IG, or TikTok.
- `.sticker` - Convert image/video to a sticker.
- `.yts [query]` - Search YouTube results.
- `.img [query]` - Fetch high-quality images.
- `.fb [link]` - Download Facebook videos.
- `.gitclone [repo]` - Send a GitHub repo as a ZIP file.

### 🤖 AI & Productivity
- `.gpt [query]` - Chat with ChatGPT/Gemini AI.
- `.dalle [prompt]` - Generate AI images from text.
- `.rembg` - Remove image background.
- `.tr [lang] [text]` - Translate text into any language.
- `.tts [text]` - Convert text to a voice note.
- `.ocr` - Extract text from an image.
- `.tempmail` - Generate a temporary 10-minute email.

### 🎮 Fun & Utility
- `.couple` - Randomly pair two members as a "couple."
- `.tictactoe` - Play a game in the chat.
- `.afk [reason]` - Set your status as away.
- `.fact` - Send a random interesting fact.

---

## 🛠️ Setup & Installation

### 1. Pairing
NEXUS-MD supports **Pairing Code** linking. You do not need to scan a QR code.
1. Run the bot.
2. Enter your phone number (with country code).
3. Copy the 8-character code and paste it into your WhatsApp "Linked Devices" notification.

### 2. Manual Installation
```bash
git clone [https://github.com/infex1rn/NEXUS-MD.git](https://github.com/infex1rn/NEXUS-MD.git)
cd NEXUS-MD
npm install
npm start
