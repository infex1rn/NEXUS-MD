/**
 * NEXUS-MD Web Server
 * Provides web interface for pairing code generation and bot dashboard
 */

import http from 'http'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Store for pending pairing requests and codes
const pairingState = {
  pendingRequest: null,
  pairingCode: null,
  phoneNumber: null,
  status: 'idle', // idle, pending, ready, connected, error
  error: null,
  connectedUser: null
}

// Export for use in Nexus.js
export { pairingState }

/**
 * Get MIME type for file extension
 */
function getMimeType(ext) {
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  }
  return mimeTypes[ext] || 'text/plain'
}

/**
 * CORS headers for API responses
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

/**
 * Parse JSON body from request
 */
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        resolve({})
      }
    })
    req.on('error', reject)
  })
}

/**
 * Send JSON response
 */
function sendJSON(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...CORS_HEADERS })
  res.end(JSON.stringify(data))
}

/**
 * Create and start the web server
 */
export function createServer(conn, requestPairingCode) {
  const PORT = process.env.PORT || 3000

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`)
    const pathname = url.pathname

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS_HEADERS)
      res.end()
      return
    }

    // API Routes
    if (pathname.startsWith('/api/')) {
      return handleAPI(req, res, pathname, conn, requestPairingCode)
    }

    // Health check for Render
    if (pathname === '/health') {
      return sendJSON(res, { 
        status: 'ok', 
        bot: process.env.BOTNAME || 'NEXUS-MD',
        timestamp: new Date().toISOString()
      })
    }

    // Serve static files
    serveStatic(req, res, pathname)
  })

  server.listen(PORT, () => {
    console.log(`\n🌐 Web Dashboard: http://localhost:${PORT}`)
    console.log(`📱 Pairing Page: http://localhost:${PORT}/#pair\n`)
  })

  return server
}

/**
 * Handle API requests
 */
async function handleAPI(req, res, pathname, conn, requestPairingCode) {
  // Health check
  if (pathname === '/api/health') {
    return sendJSON(res, { 
      status: 'ok', 
      bot: process.env.BOTNAME || 'NEXUS-MD',
      timestamp: new Date().toISOString()
    })
  }

  // Get bot status
  if (pathname === '/api/status') {
    const isConnected = conn?.user?.jid ? true : false
    return sendJSON(res, {
      bot: process.env.BOTNAME || 'NEXUS-MD',
      version: '1.0.0',
      connected: isConnected,
      user: isConnected ? {
        jid: conn.user.jid,
        name: conn.user.name || 'Unknown'
      } : null,
      pairing: {
        status: pairingState.status,
        code: pairingState.pairingCode,
        phoneNumber: pairingState.phoneNumber
      },
      features: {
        economy: true,
        casino: true,
        cards: true,
        ai: true,
        media: true,
        admin: true
      }
    })
  }

  // Request pairing code
  if (pathname === '/api/pair' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { phoneNumber } = body

      // Validate phone number
      if (!phoneNumber) {
        return sendJSON(res, { error: 'Phone number is required' }, 400)
      }

      const cleanNumber = phoneNumber.replace(/[^0-9]/g, '')
      
      if (cleanNumber.length < 10 || cleanNumber.length > 15) {
        return sendJSON(res, { 
          error: 'Invalid phone number. Use format: 1234567890 (10-15 digits with country code)' 
        }, 400)
      }

      // Check if already connected
      if (conn?.user?.jid) {
        return sendJSON(res, {
          success: true,
          alreadyConnected: true,
          message: 'Bot is already connected',
          user: {
            jid: conn.user.jid,
            name: conn.user.name || 'Unknown'
          }
        })
      }

      // Request pairing code
      pairingState.status = 'pending'
      pairingState.phoneNumber = cleanNumber
      pairingState.pairingCode = null
      pairingState.error = null

      try {
        // Call the pairing code function
        const code = await requestPairingCode(cleanNumber)
        
        if (code) {
          const formattedCode = code.match(/.{1,4}/g)?.join('-') || code
          pairingState.pairingCode = formattedCode
          pairingState.status = 'ready'

          return sendJSON(res, {
            success: true,
            pairingCode: formattedCode,
            phoneNumber: cleanNumber,
            instructions: [
              'Open WhatsApp on your phone',
              'Go to Settings > Linked Devices',
              'Tap "Link a Device"',
              `Enter the code: ${formattedCode}`
            ],
            expiresIn: '60 seconds'
          })
        } else {
          pairingState.status = 'error'
          pairingState.error = 'Failed to generate pairing code'
          return sendJSON(res, { error: 'Failed to generate pairing code' }, 500)
        }
      } catch (error) {
        pairingState.status = 'error'
        pairingState.error = error.message
        return sendJSON(res, { error: error.message }, 500)
      }
    } catch (error) {
      return sendJSON(res, { error: 'Invalid request' }, 400)
    }
  }

  // Get pairing status
  if (pathname === '/api/pair/status') {
    return sendJSON(res, {
      status: pairingState.status,
      pairingCode: pairingState.pairingCode,
      phoneNumber: pairingState.phoneNumber,
      error: pairingState.error,
      connected: conn?.user?.jid ? true : false,
      user: conn?.user?.jid ? {
        jid: conn.user.jid,
        name: conn.user.name || 'Unknown'
      } : null
    })
  }

  // Commands list
  if (pathname === '/api/commands') {
    return sendJSON(res, getCommandsList())
  }

  // Bot configuration
  if (pathname === '/api/config') {
    return sendJSON(res, {
      prefix: process.env.PREFIX || '.',
      botName: process.env.BOTNAME || 'NEXUS-MD',
      firebase: process.env.FIREBASE_PROJECT_ID ? 'Connected' : 'Not configured'
    })
  }

  // 404 for unknown API routes
  return sendJSON(res, { error: 'Not found' }, 404)
}

/**
 * Serve static files
 */
function serveStatic(req, res, pathname) {
  // Default to index.html
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html'
  }

  // Try to serve from web/public directory
  const filePath = path.join(__dirname, 'web', 'public', pathname)
  
  if (existsSync(filePath)) {
    try {
      const content = readFileSync(filePath)
      const ext = path.extname(filePath)
      res.writeHead(200, { 'Content-Type': getMimeType(ext), ...CORS_HEADERS })
      res.end(content)
      return
    } catch {
      // Fall through to serve inline HTML
    }
  }

  // Serve the dashboard HTML inline if file not found
  if (pathname === '/index.html' || pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html', ...CORS_HEADERS })
    res.end(getDashboardHTML())
    return
  }

  // 404 for other files
  res.writeHead(404, { 'Content-Type': 'text/plain', ...CORS_HEADERS })
  res.end('Not Found')
}

/**
 * Get commands list for API
 */
function getCommandsList() {
  return {
    economy: [
      { name: 'balance', desc: 'Check wallet and bank' },
      { name: 'daily', desc: 'Claim daily rewards' },
      { name: 'work', desc: 'Work to earn coins' },
      { name: 'mine', desc: 'Mine for resources' },
      { name: 'fish', desc: 'Go fishing' },
      { name: 'hunt', desc: 'Hunt for rewards' },
      { name: 'crime', desc: 'Risky money making' },
      { name: 'pay', desc: 'Transfer coins to user' },
      { name: 'deposit', desc: 'Deposit to bank' },
      { name: 'withdraw', desc: 'Withdraw from bank' },
      { name: 'leaderboard', desc: 'View rich list' }
    ],
    casino: [
      { name: 'slots', desc: 'Slot machine gambling' },
      { name: 'coinflip', desc: 'Heads or tails bet' },
      { name: 'dice', desc: 'Dice betting game' },
      { name: 'blackjack', desc: 'Play blackjack' },
      { name: 'roulette', desc: 'Roulette wheel' },
      { name: 'crash', desc: 'Crash multiplier game' }
    ],
    cards: [
      { name: 'claim', desc: 'Claim dropped card' },
      { name: 'collection', desc: 'View your cards' },
      { name: 'send', desc: 'Send card to user' },
      { name: 'gacha', desc: 'Pull cards with coins' },
      { name: 'cardinfo', desc: 'View card details' },
      { name: 'favorite', desc: 'Lock/unlock cards' },
      { name: 'sell', desc: 'Sell cards for coins' }
    ],
    admin: [
      { name: 'tagall', desc: 'Tag all members' },
      { name: 'hidetag', desc: 'Hidden tag all' },
      { name: 'kick', desc: 'Remove member' },
      { name: 'add', desc: 'Add member' },
      { name: 'promote', desc: 'Make admin' },
      { name: 'demote', desc: 'Remove admin' },
      { name: 'mute', desc: 'Mute group' },
      { name: 'antilink', desc: 'Toggle antilink' },
      { name: 'warn', desc: 'Warn user' },
      { name: 'welcome', desc: 'Set welcome message' }
    ],
    media: [
      { name: 'play', desc: 'YouTube audio' },
      { name: 'video', desc: 'YouTube/TikTok video' },
      { name: 'sticker', desc: 'Create sticker' },
      { name: 'yts', desc: 'YouTube search' },
      { name: 'img', desc: 'Image search' },
      { name: 'rembg', desc: 'Remove background' },
      { name: 'tiktok', desc: 'Download TikTok' }
    ],
    tools: [
      { name: 'gpt', desc: 'AI chat' },
      { name: 'dalle', desc: 'AI image generation' },
      { name: 'translate', desc: 'Translate text' },
      { name: 'tts', desc: 'Text to speech' },
      { name: 'ocr', desc: 'Image to text' },
      { name: 'tempmail', desc: 'Temporary email' },
      { name: 'weather', desc: 'Weather info' }
    ],
    fun: [
      { name: 'tictactoe', desc: 'Play tic-tac-toe' },
      { name: 'couple', desc: 'Random couple' },
      { name: '8ball', desc: 'Magic 8-ball' },
      { name: 'joke', desc: 'Random joke' },
      { name: 'quote', desc: 'Random quote' },
      { name: 'fact', desc: 'Random fact' },
      { name: 'meme', desc: 'Random meme' }
    ]
  }
}

/**
 * Get dashboard HTML with enhanced pairing functionality
 */
function getDashboardHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NEXUS-MD Dashboard</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
  <style>
    :root { --primary: #8b5cf6; --dark: #1e1b4b; }
    body { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%); min-height: 100vh; }
    .glass { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); }
    .glow { box-shadow: 0 0 20px rgba(139, 92, 246, 0.5); }
    .card-hover:hover { transform: translateY(-5px); box-shadow: 0 10px 40px rgba(139, 92, 246, 0.3); }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    .float { animation: float 3s ease-in-out infinite; }
    .gradient-text { background: linear-gradient(90deg, #8b5cf6, #ec4899, #8b5cf6); background-size: 200%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: gradient 3s linear infinite; }
    @keyframes gradient { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
    .pairing-code { font-family: 'Courier New', monospace; font-size: 2.5rem; letter-spacing: 0.5rem; }
    @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.5); } 50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.8); } }
    .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
  </style>
</head>
<body class="text-white">
  <!-- Navigation -->
  <nav class="glass fixed w-full z-50 px-6 py-4">
    <div class="container mx-auto flex justify-between items-center">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center glow">
          <i class="fas fa-robot text-xl"></i>
        </div>
        <span class="text-2xl font-bold gradient-text">NEXUS-MD</span>
      </div>
      <div class="hidden md:flex space-x-8">
        <a href="#features" class="hover:text-purple-400 transition">Features</a>
        <a href="#commands" class="hover:text-purple-400 transition">Commands</a>
        <a href="#pair" class="hover:text-purple-400 transition">Pair Device</a>
      </div>
      <div id="connectionStatus" class="hidden md:flex items-center">
        <span class="w-3 h-3 rounded-full mr-2 bg-gray-500"></span>
        <span class="text-sm text-gray-400">Checking...</span>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="pt-32 pb-20 px-6">
    <div class="container mx-auto text-center">
      <div class="float inline-block mb-8">
        <div class="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center glow">
          <i class="fab fa-whatsapp text-6xl"></i>
        </div>
      </div>
      <h1 class="text-5xl md:text-7xl font-bold mb-6">
        <span class="gradient-text">NEXUS-MD</span>
      </h1>
      <p class="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
        A powerful multi-device WhatsApp bot with economy system, casino games, anime card collection, and 100+ commands.
      </p>
      <div class="flex flex-wrap justify-center gap-4">
        <a href="#pair" class="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-bold hover:opacity-90 transition glow">
          <i class="fas fa-link mr-2"></i>Pair Device
        </a>
        <a href="https://github.com/infex1rn/NEXUS-MD" target="_blank" class="px-8 py-4 glass rounded-full font-bold hover:bg-white/20 transition">
          <i class="fab fa-github mr-2"></i>GitHub
        </a>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section id="features" class="py-20 px-6">
    <div class="container mx-auto">
      <h2 class="text-4xl font-bold text-center mb-12">
        <i class="fas fa-star text-yellow-400 mr-3"></i>Features
      </h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="glass rounded-2xl p-6 card-hover transition-all">
          <div class="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
            <i class="fas fa-coins text-3xl text-green-400"></i>
          </div>
          <h3 class="text-xl font-bold mb-2">Economy System</h3>
          <p class="text-gray-400">Wallet, bank, daily rewards, work activities, and leaderboards.</p>
        </div>
        <div class="glass rounded-2xl p-6 card-hover transition-all">
          <div class="w-16 h-16 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
            <i class="fas fa-dice text-3xl text-red-400"></i>
          </div>
          <h3 class="text-xl font-bold mb-2">Casino Games</h3>
          <p class="text-gray-400">Slots, blackjack, roulette, coinflip, dice, and crash betting.</p>
        </div>
        <div class="glass rounded-2xl p-6 card-hover transition-all">
          <div class="w-16 h-16 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4">
            <i class="fas fa-id-card text-3xl text-pink-400"></i>
          </div>
          <h3 class="text-xl font-bold mb-2">Anime Cards</h3>
          <p class="text-gray-400">1000+ anime characters, hourly drops, trading, and collection.</p>
        </div>
        <div class="glass rounded-2xl p-6 card-hover transition-all">
          <div class="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
            <i class="fas fa-brain text-3xl text-blue-400"></i>
          </div>
          <h3 class="text-xl font-bold mb-2">AI Powered</h3>
          <p class="text-gray-400">ChatGPT, DALL-E image generation, and smart responses.</p>
        </div>
        <div class="glass rounded-2xl p-6 card-hover transition-all">
          <div class="w-16 h-16 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-4">
            <i class="fas fa-users-cog text-3xl text-yellow-400"></i>
          </div>
          <h3 class="text-xl font-bold mb-2">Admin Tools</h3>
          <p class="text-gray-400">Complete group management with antilink, warnings, and moderation.</p>
        </div>
        <div class="glass rounded-2xl p-6 card-hover transition-all">
          <div class="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
            <i class="fas fa-download text-3xl text-purple-400"></i>
          </div>
          <h3 class="text-xl font-bold mb-2">Media Download</h3>
          <p class="text-gray-400">YouTube, TikTok, Instagram, and image downloads.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Pair Device Section -->
  <section id="pair" class="py-20 px-6">
    <div class="container mx-auto max-w-2xl">
      <div class="glass rounded-3xl p-8 glow">
        <h2 class="text-3xl font-bold text-center mb-2">
          <i class="fas fa-link text-purple-400 mr-3"></i>Pair Your Device
        </h2>
        <p class="text-gray-400 text-center mb-8">Link your WhatsApp number using pairing code</p>
        
        <!-- Connection Status Banner -->
        <div id="connectedBanner" class="hidden mb-6 p-4 bg-green-500/20 border border-green-500 rounded-xl">
          <div class="flex items-center">
            <i class="fas fa-check-circle text-green-400 text-2xl mr-3"></i>
            <div>
              <h4 class="font-bold text-green-400">Bot Connected!</h4>
              <p class="text-sm text-gray-300" id="connectedUser"></p>
            </div>
          </div>
        </div>
        
        <!-- Pairing Form -->
        <div id="pairingForm" class="space-y-6">
          <div>
            <label class="block text-gray-300 mb-2">Phone Number (with country code)</label>
            <div class="flex">
              <span class="glass px-4 py-3 rounded-l-xl text-gray-400 border-r border-white/10">+</span>
              <input type="tel" id="phoneNumber" placeholder="1234567890" 
                class="flex-1 bg-white/10 px-4 py-3 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition">
            </div>
            <p class="text-xs text-gray-500 mt-2">Example: 1234567890 (without + or spaces)</p>
          </div>
          
          <button onclick="requestPairing()" id="pairBtn"
            class="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center">
            <i class="fas fa-qrcode mr-2"></i>Get Pairing Code
          </button>
        </div>
        
        <!-- Pairing Code Display -->
        <div id="pairingCodeDisplay" class="hidden mt-6">
          <div class="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-2xl p-8 text-center pulse-glow">
            <p class="text-gray-400 mb-2">Your Pairing Code</p>
            <div class="pairing-code text-white font-bold" id="pairingCodeText">----</div>
            <p class="text-sm text-gray-400 mt-4"><i class="fas fa-clock mr-1"></i>Code expires in <span id="countdown">60</span> seconds</p>
          </div>
          
          <div class="mt-6 space-y-3">
            <div class="flex items-center text-sm">
              <span class="w-6 h-6 bg-purple-500/30 rounded-full flex items-center justify-center mr-3 text-purple-400">1</span>
              <span class="text-gray-300">Open WhatsApp on your phone</span>
            </div>
            <div class="flex items-center text-sm">
              <span class="w-6 h-6 bg-purple-500/30 rounded-full flex items-center justify-center mr-3 text-purple-400">2</span>
              <span class="text-gray-300">Go to Settings → Linked Devices</span>
            </div>
            <div class="flex items-center text-sm">
              <span class="w-6 h-6 bg-purple-500/30 rounded-full flex items-center justify-center mr-3 text-purple-400">3</span>
              <span class="text-gray-300">Tap "Link a Device"</span>
            </div>
            <div class="flex items-center text-sm">
              <span class="w-6 h-6 bg-purple-500/30 rounded-full flex items-center justify-center mr-3 text-purple-400">4</span>
              <span class="text-gray-300">Enter the code shown above</span>
            </div>
          </div>
          
          <button onclick="resetPairing()" class="w-full mt-6 py-3 glass rounded-xl hover:bg-white/20 transition">
            <i class="fas fa-redo mr-2"></i>Request New Code
          </button>
        </div>
        
        <!-- Error/Result Display -->
        <div id="pairingResult" class="hidden mt-6 p-4 rounded-xl"></div>
      </div>
    </div>
  </section>

  <!-- Commands Section -->
  <section id="commands" class="py-20 px-6 bg-black/20">
    <div class="container mx-auto">
      <h2 class="text-4xl font-bold text-center mb-12">
        <i class="fas fa-terminal text-purple-400 mr-3"></i>Commands
      </h2>
      <div id="commandsList" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Commands loaded via JS -->
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="glass py-8 px-6 mt-20">
    <div class="container mx-auto text-center">
      <p class="text-gray-400">© 2024 NEXUS-MD. Built with <i class="fas fa-heart text-red-500"></i> using Baileys & Firebase</p>
      <div class="flex justify-center space-x-6 mt-4">
        <a href="https://github.com/infex1rn/NEXUS-MD" class="text-gray-400 hover:text-white"><i class="fab fa-github text-2xl"></i></a>
      </div>
    </div>
  </footer>

  <script>
    let countdownInterval = null;
    let statusCheckInterval = null;
    
    // Check bot status on load
    async function checkStatus() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        
        const statusEl = document.getElementById('connectionStatus');
        const statusDot = statusEl.querySelector('span:first-child');
        const statusText = statusEl.querySelector('span:last-child');
        
        if (data.connected) {
          statusDot.className = 'w-3 h-3 rounded-full mr-2 bg-green-500';
          statusText.textContent = 'Connected';
          statusText.className = 'text-sm text-green-400';
          showConnectedBanner(data.user);
        } else {
          statusDot.className = 'w-3 h-3 rounded-full mr-2 bg-yellow-500';
          statusText.textContent = 'Not Paired';
          statusText.className = 'text-sm text-yellow-400';
        }
      } catch (e) {
        console.error('Status check failed:', e);
      }
    }
    
    function showConnectedBanner(user) {
      const banner = document.getElementById('connectedBanner');
      const form = document.getElementById('pairingForm');
      const codeDisplay = document.getElementById('pairingCodeDisplay');
      const userText = document.getElementById('connectedUser');
      
      banner.classList.remove('hidden');
      form.classList.add('hidden');
      codeDisplay.classList.add('hidden');
      
      if (user) {
        userText.textContent = 'Connected as: ' + (user.name || user.jid);
      }
    }
    
    // Request pairing code
    async function requestPairing() {
      const phone = document.getElementById('phoneNumber').value.trim();
      const result = document.getElementById('pairingResult');
      const btn = document.getElementById('pairBtn');
      
      if (!phone) {
        showResult('error', 'Please enter your phone number');
        return;
      }
      
      if (!/^\\d{10,15}$/.test(phone.replace(/\\D/g, ''))) {
        showResult('error', 'Invalid phone number format. Use 10-15 digits with country code.');
        return;
      }
      
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating Code...';
      result.classList.add('hidden');
      
      try {
        const res = await fetch('/api/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: phone })
        });
        const data = await res.json();
        
        if (data.success) {
          if (data.alreadyConnected) {
            showConnectedBanner(data.user);
          } else if (data.pairingCode) {
            showPairingCode(data.pairingCode);
            startStatusPolling();
          }
        } else {
          showResult('error', data.error || 'Failed to generate pairing code');
        }
      } catch (e) {
        showResult('error', 'Network error. Please try again.');
      }
      
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-qrcode mr-2"></i>Get Pairing Code';
    }
    
    function showPairingCode(code) {
      document.getElementById('pairingForm').classList.add('hidden');
      document.getElementById('pairingCodeDisplay').classList.remove('hidden');
      document.getElementById('pairingCodeText').textContent = code;
      document.getElementById('pairingResult').classList.add('hidden');
      
      // Start countdown
      let seconds = 60;
      const countdownEl = document.getElementById('countdown');
      
      if (countdownInterval) clearInterval(countdownInterval);
      
      countdownInterval = setInterval(() => {
        seconds--;
        countdownEl.textContent = seconds;
        
        if (seconds <= 0) {
          clearInterval(countdownInterval);
          showResult('warning', 'Pairing code expired. Please request a new one.');
        }
      }, 1000);
    }
    
    function startStatusPolling() {
      if (statusCheckInterval) clearInterval(statusCheckInterval);
      
      statusCheckInterval = setInterval(async () => {
        try {
          const res = await fetch('/api/pair/status');
          const data = await res.json();
          
          if (data.connected) {
            clearInterval(statusCheckInterval);
            clearInterval(countdownInterval);
            showConnectedBanner(data.user);
            showResult('success', 'Successfully connected! Bot is now online.');
          }
        } catch (e) {
          console.error('Status poll failed:', e);
        }
      }, 3000);
    }
    
    function resetPairing() {
      if (countdownInterval) clearInterval(countdownInterval);
      if (statusCheckInterval) clearInterval(statusCheckInterval);
      
      document.getElementById('pairingForm').classList.remove('hidden');
      document.getElementById('pairingCodeDisplay').classList.add('hidden');
      document.getElementById('pairingResult').classList.add('hidden');
      document.getElementById('phoneNumber').value = '';
    }
    
    function showResult(type, message) {
      const result = document.getElementById('pairingResult');
      result.classList.remove('hidden');
      
      const colors = {
        error: { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', icon: 'fa-exclamation-circle' },
        success: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400', icon: 'fa-check-circle' },
        warning: { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400', icon: 'fa-exclamation-triangle' }
      };
      
      const c = colors[type] || colors.error;
      result.className = 'mt-6 p-4 rounded-xl ' + c.bg + ' border ' + c.border;
      result.innerHTML = '<i class="fas ' + c.icon + ' mr-2 ' + c.text + '"></i>' + message;
    }
    
    // Load commands
    async function loadCommands() {
      try {
        const res = await fetch('/api/commands');
        const commands = await res.json();
        const container = document.getElementById('commandsList');
        
        const categories = {
          economy: { icon: 'fa-coins', color: 'green' },
          casino: { icon: 'fa-dice', color: 'red' },
          cards: { icon: 'fa-id-card', color: 'pink' },
          admin: { icon: 'fa-user-shield', color: 'yellow' },
          media: { icon: 'fa-photo-video', color: 'blue' },
          tools: { icon: 'fa-tools', color: 'purple' },
          fun: { icon: 'fa-gamepad', color: 'indigo' }
        };
        
        let html = '';
        for (const [category, cmds] of Object.entries(commands)) {
          const cat = categories[category] || { icon: 'fa-terminal', color: 'gray' };
          html += \`
            <div class="glass rounded-2xl p-6">
              <h3 class="text-lg font-bold mb-4 flex items-center">
                <i class="fas \${cat.icon} text-\${cat.color}-400 mr-2"></i>
                \${category.charAt(0).toUpperCase() + category.slice(1)}
              </h3>
              <div class="space-y-2">
                \${cmds.map(c => \`
                  <div class="flex justify-between items-center text-sm">
                    <code class="text-purple-400">.\${c.name}</code>
                    <span class="text-gray-400">\${c.desc}</span>
                  </div>
                \`).join('')}
              </div>
            </div>
          \`;
        }
        container.innerHTML = html;
      } catch (e) {
        console.error('Failed to load commands:', e);
      }
    }
    
    // Init
    document.addEventListener('DOMContentLoaded', () => {
      checkStatus();
      loadCommands();
      
      // Check status periodically
      setInterval(checkStatus, 30000);
    });
  </script>
</body>
</html>`
}
