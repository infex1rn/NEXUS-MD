# NEXUS-MD

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js" />
  <img src="https://img.shields.io/badge/WhatsApp-Multi--Device-25D366?style=for-the-badge&logo=whatsapp" />
  <img src="https://img.shields.io/badge/Firebase-Database-FFCA28?style=for-the-badge&logo=firebase" />
  <img src="https://img.shields.io/badge/Commands-70+-blue?style=for-the-badge" />
</p>

A powerful, modular, and high-performance WhatsApp Bot built with [@whiskeysockets/baileys](https://github.com/whiskeysockets/baileys) and Firebase. Inspired by popular bots like GURU-Ai.

## ✨ Features

- 🔗 **Pairing Code System** - Link your WhatsApp via web interface (no QR scanning needed)
- 🌐 **Web Dashboard** - Beautiful web interface for pairing and bot management
- 🔌 **70+ Modular Commands** - Easily extendable plugin system
- 🔥 **Firebase Integration** - Persistent data storage with Firestore
- 📱 **Multi-Device Support** - Works with WhatsApp Web Multi-Device
- 🚀 **High Performance** - Optimized for speed and reliability
- 🐳 **Docker Ready** - Easy deployment with Docker
- ☁️ **Render Ready** - One-click deployment on Render
- ⚡ **Auto-Reload Plugins** - Hot reload plugins without restart

## 📦 Complete Command List (70+ Commands)

### 🏠 Main Commands
| Command | Description |
|---------|-------------|
| `.menu` / `.help` | Display bot menu with all commands |
| `.list` | List all commands by category |
| `.ping` | Check bot response time |
| `.alive` | Check if bot is online |
| `.owner` | Show bot owner information |

### 👥 Group Admin Commands
| Command | Description |
|---------|-------------|
| `.tagall [msg]` | Tag all group members |
| `.hidetag [msg]` | Tag all members invisibly |
| `.kick @user` | Remove a member from group |
| `.add <number>` | Add a member to group |
| `.promote @user` | Promote member to admin |
| `.demote @user` | Demote admin to member |
| `.mute` / `.unmute` | Lock/unlock group chat |
| `.antilink on/off` | Enable/disable link protection |
| `.warn @user` | Warn a user (auto-kick at 3) |
| `.warns [@user]` | Check user warnings |
| `.delwarn @user` | Clear user warnings |
| `.welcome on/off` | Toggle welcome messages |
| `.setwelcome <msg>` | Set custom welcome message |
| `.setbye <msg>` | Set custom goodbye message |
| `.groupinfo` | Get detailed group info |
| `.link` | Get group invite link |
| `.revoke` | Reset group invite link |
| `.invite <number>` | Send invite to user |
| `.poll <q> \| <opt1> \| <opt2>` | Create a poll |
| `.staff` | List all group admins |

### 📥 Downloader Commands
| Command | Description |
|---------|-------------|
| `.play <song>` | Search & download YouTube audio |
| `.video <name/url>` | Download YouTube/TikTok videos |
| `.yts <query>` | Search YouTube videos |
| `.ig <url>` | Download Instagram media |
| `.tiktok <url>` | Download TikTok videos |
| `.fb <url>` | Download Facebook videos |
| `.img <query>` | Search and download images |

### 🎨 Sticker Commands
| Command | Description |
|---------|-------------|
| `.sticker` / `.s` | Convert image/video to sticker |
| `.toimg` | Convert sticker to image |
| `.togif` | Convert animated sticker to GIF |

### 🔧 Tools Commands
| Command | Description |
|---------|-------------|
| `.gpt <message>` | Chat with AI assistant |
| `.ai <message>` | Chat with AI (alias) |
| `.resetai` | Clear AI chat history |
| `.dalle <prompt>` | Generate AI images |
| `.translate <lang> <text>` | Translate text |
| `.tts [lang] <text>` | Text to voice note |
| `.ocr` | Extract text from image |
| `.tempmail` | Generate temporary email |
| `.inbox` | Check temp email inbox |
| `.rembg` | Remove image background |
| `.upscale` | Enhance image quality |
| `.short <url>` | Shorten a URL |
| `.qr <text>` | Generate QR code |

### 🎮 Fun & Games
| Command | Description |
|---------|-------------|
| `.couple` | Random couple matching |
| `.tictactoe @user` | Play tic-tac-toe |
| `.8ball <question>` | Magic 8-ball |
| `.dice [sides] [count]` | Roll dice |
| `.flip` | Flip a coin |
| `.rate <something>` | Rate something /10 |
| `.joke` | Get a random joke |
| `.truth` / `.dare` | Truth or dare |
| `.fact` | Get random facts |
| `.quote` | Get inspirational quotes |
| `.meme` | Get random memes |
| `.slap @user` | Slap someone |
| `.hug @user` | Hug someone |
| `.pat @user` | Pat someone |

### ⚙️ Utility Commands
| Command | Description |
|---------|-------------|
| `.afk [reason]` | Set AFK status |
| `.weather <city>` | Get weather info |
| `.runtime` | Show bot uptime |
| `.profile [@user]` | Get user profile |
| `.calc <expression>` | Calculator |
| `.remind <time> <msg>` | Set a reminder |
| `.base64 encode/decode <text>` | Base64 encode/decode |

### ⚙️ Config Commands
| Command | Description |
|---------|-------------|
| `.enable <option> on/off` | Toggle bot features |
| `.on <option>` | Enable a feature |
| `.off <option>` | Disable a feature |

### 👑 Owner Commands
| Command | Description |
|---------|-------------|
| `.broadcast <msg>` | Broadcast to all chats |
| `.block @user` | Block a user |
| `.unblock @user` | Unblock a user |
| `.ban @user` | Ban user from bot |
| `.unban @user` | Unban a user |
| `.join <link>` | Join a group |
| `.leave` | Leave current group |
| `.setprefix <char>` | Change bot prefix |
| `.stats` | Show bot statistics |
| `> <code>` | Execute JavaScript |

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- A WhatsApp account
- Firebase project (optional, for persistent database)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/NEXUS-MD.git
cd NEXUS-MD

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start the bot
npm start
```

### Configuration (.env)
```env
OWNERS=1234567890;YourName

# Firebase (optional)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Link Your WhatsApp (Web Interface)

1. Start the bot with `npm start`
2. Open the web dashboard at `http://localhost:3000` (or your deployed URL)
3. Go to the "Pair Device" section
4. Enter your phone number (with country code)
5. Click "Get Pairing Code"
6. Open WhatsApp → Settings → Linked Devices → Link a Device
7. Enter the pairing code shown on the web page

## 🔥 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Go to Project Settings → Service Accounts
4. Generate new private key
5. Add credentials to `.env` file

## 🐳 Docker Deployment

```bash
# Build the image
docker build -t nexus-md .

# Run the container
docker run -d --name nexus-md \
  -e FIREBASE_PROJECT_ID=your-project-id \
  -p 3000:3000 \
  nexus-md
```

After starting the container, open `http://localhost:3000` and use the web interface to pair your device.

## ☁️ Render Deployment

1. Fork this repository
2. Create a new Web Service on [Render](https://render.com)
3. Connect your forked repository
4. Set the following environment variables:
   - `FIREBASE_PROJECT_ID` - Your Firebase project ID
   - `FIREBASE_CLIENT_EMAIL` - Firebase service account email
   - `FIREBASE_PRIVATE_KEY` - Firebase private key (with newlines)
   - `BOTNAME` - Your bot name (optional)
5. Deploy and wait for the build to complete
6. Open your Render URL and use the web interface to pair your device

## 📁 Project Structure

```
NEXUS-MD/
├── Nexus.js           # Main bot entry point
├── server.js          # Web server for dashboard & pairing API
├── handler.js         # Message handler
├── config.js          # Bot configuration
├── lib/
│   ├── simple.js      # Extended WASocket
│   ├── firebase.js    # Firebase Firestore database
│   └── sticker.js     # Sticker utilities
├── web/
│   └── public/        # Static web assets
├── plugins/
│   └── index/         # 70+ Command plugins
├── test.js            # Test suite
├── package.json
├── Dockerfile
├── render.yaml        # Render deployment config
└── .env.example
```

## 🧪 Running Tests

```bash
npm test
```

## 🔧 Creating Custom Plugins

```javascript
// plugins/index/custom-example.js
let handler = async (m, { conn, text, usedPrefix, command }) => {
  m.reply('Hello from custom command!')
}

handler.help = ['example']
handler.tags = ['custom']
handler.command = ['example', 'ex']
handler.desc = 'Example custom command'

// Optional permissions
// handler.admin = true
// handler.group = true
// handler.owner = true

export default handler
```

## ⚠️ Disclaimer

This bot is for educational purposes. Use responsibly and in accordance with WhatsApp's Terms of Service.

## 📄 License

MIT License

## 🤝 Credits

- Inspired by [GURU-Ai](https://github.com/Guru322/GURU-Ai)
- Built with [@whiskeysockets/baileys](https://github.com/whiskeysockets/baileys)

---

<p align="center">Made with ❤️ by NEXUS-MD Team</p>
