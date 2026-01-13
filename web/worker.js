/**
 * NEXUS-MD Dashboard - Cloudflare Worker
 * Web interface for bot control and pairing
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Simple JWT verification
async function verifyToken(token, secret) {
  try {
    const [headerB64, payloadB64, signature] = token.split('.');
    const payload = JSON.parse(atob(payloadB64));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Generate simple token
function generateToken(data, secret, expiresIn = 86400000) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ ...data, exp: Date.now() + expiresIn }));
  const signature = btoa(secret + payload);
  return `${header}.${payload}.${signature}`;
}

// Generate pairing code (8 digits)
function generatePairingCode() {
  return Math.random().toString().slice(2, 10);
}

// API Routes
async function handleAPI(request, env, path) {
  const url = new URL(request.url);
  
  // Health check
  if (path === '/api/health') {
    return new Response(JSON.stringify({ 
      status: 'ok', 
      bot: env.BOT_NAME || 'NEXUS-MD',
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }

  // Generate pairing code
  if (path === '/api/pair' && request.method === 'POST') {
    try {
      const body = await request.json();
      const { phoneNumber } = body;
      
      if (!phoneNumber || !/^\d{10,15}$/.test(phoneNumber.replace(/\D/g, ''))) {
        return new Response(JSON.stringify({ 
          error: 'Invalid phone number. Use format: 1234567890' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      }

      const cleanNumber = phoneNumber.replace(/\D/g, '');
      const pairingCode = generatePairingCode();
      
      // In production, this would trigger the bot to generate actual pairing code
      // For now, return instructions
      return new Response(JSON.stringify({
        success: true,
        message: 'Pairing code request received',
        phoneNumber: cleanNumber,
        instructions: [
          '1. Make sure the bot is running on your server',
          '2. The bot will generate a pairing code in the terminal',
          '3. Open WhatsApp > Settings > Linked Devices > Link a Device',
          '4. Enter the pairing code shown in the terminal'
        ],
        note: 'Start the bot with: npm start'
      }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }
  }

  // Get bot status
  if (path === '/api/status') {
    return new Response(JSON.stringify({
      bot: env.BOT_NAME || 'NEXUS-MD',
      version: '1.0.0',
      features: {
        economy: true,
        casino: true,
        cards: true,
        ai: true,
        media: true,
        admin: true
      },
      commands: 100,
      uptime: 'Check bot terminal'
    }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }

  // Bot configuration
  if (path === '/api/config' && request.method === 'GET') {
    return new Response(JSON.stringify({
      prefix: '.',
      ownerNumber: env.OWNER_NUMBER ? '***hidden***' : 'Not set',
      firebase: env.FIREBASE_PROJECT_ID ? 'Connected' : 'Not configured',
      features: {
        antilink: true,
        welcome: true,
        autoRead: false,
        autoTyping: false
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }

  // Commands list
  if (path === '/api/commands') {
    const commands = {
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
    };
    
    return new Response(JSON.stringify(commands), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
}

// Serve static HTML
function serveHTML() {
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
    .animate-pulse-slow { animation: pulse 3s infinite; }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    .float { animation: float 3s ease-in-out infinite; }
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
        <span class="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">NEXUS-MD</span>
      </div>
      <div class="hidden md:flex space-x-8">
        <a href="#features" class="hover:text-purple-400 transition">Features</a>
        <a href="#commands" class="hover:text-purple-400 transition">Commands</a>
        <a href="#pair" class="hover:text-purple-400 transition">Pair Device</a>
        <a href="#deploy" class="hover:text-purple-400 transition">Deploy</a>
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
        <span class="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">NEXUS-MD</span>
      </h1>
      <p class="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
        A powerful multi-device WhatsApp bot with economy system, casino games, anime card collection, and 100+ commands.
      </p>
      <div class="flex justify-center space-x-4">
        <a href="#pair" class="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-bold hover:opacity-90 transition glow">
          <i class="fas fa-link mr-2"></i>Pair Device
        </a>
        <a href="https://github.com/infex1rn/NEXUS-MD" class="px-8 py-4 glass rounded-full font-bold hover:bg-white/20 transition">
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
        <h2 class="text-3xl font-bold text-center mb-8">
          <i class="fas fa-link text-purple-400 mr-3"></i>Pair Your Device
        </h2>
        <div class="space-y-6">
          <div>
            <label class="block text-gray-300 mb-2">Phone Number (with country code)</label>
            <div class="flex">
              <span class="glass px-4 py-3 rounded-l-xl text-gray-400">+</span>
              <input type="tel" id="phoneNumber" placeholder="1234567890" 
                class="flex-1 bg-white/10 px-4 py-3 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-purple-500">
            </div>
          </div>
          <button onclick="requestPairing()" 
            class="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold hover:opacity-90 transition">
            <i class="fas fa-qrcode mr-2"></i>Get Pairing Code
          </button>
          <div id="pairingResult" class="hidden mt-6 p-4 rounded-xl"></div>
        </div>
        <div class="mt-8 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
          <h4 class="font-bold text-yellow-400 mb-2"><i class="fas fa-info-circle mr-2"></i>How to Pair</h4>
          <ol class="text-sm text-gray-300 space-y-1">
            <li>1. Deploy and run the bot on your server</li>
            <li>2. Enter your WhatsApp number above</li>
            <li>3. Run <code class="bg-black/30 px-2 py-1 rounded">npm start</code> on your server</li>
            <li>4. Enter the pairing code shown in terminal on WhatsApp</li>
          </ol>
        </div>
      </div>
    </div>
  </section>

  <!-- Commands Section -->
  <section id="commands" class="py-20 px-6">
    <div class="container mx-auto">
      <h2 class="text-4xl font-bold text-center mb-12">
        <i class="fas fa-terminal text-purple-400 mr-3"></i>Commands
      </h2>
      <div id="commandsList" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Commands loaded via JS -->
      </div>
    </div>
  </section>

  <!-- Deploy Section -->
  <section id="deploy" class="py-20 px-6">
    <div class="container mx-auto max-w-4xl">
      <h2 class="text-4xl font-bold text-center mb-12">
        <i class="fas fa-rocket text-purple-400 mr-3"></i>Deploy
      </h2>
      <div class="grid md:grid-cols-2 gap-8">
        <div class="glass rounded-2xl p-6">
          <h3 class="text-xl font-bold mb-4 flex items-center">
            <img src="https://www.herokucdn.com/favicons/favicon.ico" class="w-6 h-6 mr-2"> Heroku
          </h3>
          <a href="https://heroku.com/deploy?template=https://github.com/infex1rn/NEXUS-MD" 
            class="block w-full py-3 bg-purple-600 rounded-lg text-center hover:bg-purple-700 transition">
            Deploy to Heroku
          </a>
        </div>
        <div class="glass rounded-2xl p-6">
          <h3 class="text-xl font-bold mb-4 flex items-center">
            <i class="fab fa-docker text-blue-400 text-2xl mr-2"></i> Docker
          </h3>
          <pre class="bg-black/50 p-3 rounded-lg text-sm overflow-x-auto">docker run -d nexus-md</pre>
        </div>
        <div class="glass rounded-2xl p-6">
          <h3 class="text-xl font-bold mb-4 flex items-center">
            <i class="fas fa-cloud text-orange-400 text-2xl mr-2"></i> Cloudflare
          </h3>
          <pre class="bg-black/50 p-3 rounded-lg text-sm overflow-x-auto">npx wrangler deploy</pre>
        </div>
        <div class="glass rounded-2xl p-6">
          <h3 class="text-xl font-bold mb-4 flex items-center">
            <i class="fas fa-server text-green-400 text-2xl mr-2"></i> VPS / Local
          </h3>
          <pre class="bg-black/50 p-3 rounded-lg text-sm overflow-x-auto">npm install && npm start</pre>
        </div>
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
    
    // Request pairing
    async function requestPairing() {
      const phone = document.getElementById('phoneNumber').value;
      const result = document.getElementById('pairingResult');
      
      if (!phone) {
        result.className = 'mt-6 p-4 rounded-xl bg-red-500/20 border border-red-500';
        result.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i>Please enter your phone number';
        result.classList.remove('hidden');
        return;
      }
      
      try {
        const res = await fetch('/api/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: phone })
        });
        const data = await res.json();
        
        if (data.success) {
          result.className = 'mt-6 p-4 rounded-xl bg-green-500/20 border border-green-500';
          result.innerHTML = \`
            <h4 class="font-bold text-green-400 mb-2"><i class="fas fa-check-circle mr-2"></i>Request Received!</h4>
            <p class="text-sm text-gray-300 mb-2">Phone: +\${data.phoneNumber}</p>
            <ul class="text-sm text-gray-400 space-y-1">
              \${data.instructions.map(i => '<li>' + i + '</li>').join('')}
            </ul>
          \`;
        } else {
          result.className = 'mt-6 p-4 rounded-xl bg-red-500/20 border border-red-500';
          result.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i>' + (data.error || 'Request failed');
        }
        result.classList.remove('hidden');
      } catch (e) {
        result.className = 'mt-6 p-4 rounded-xl bg-red-500/20 border border-red-500';
        result.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i>Network error';
        result.classList.remove('hidden');
      }
    }
    
    // Init
    document.addEventListener('DOMContentLoaded', loadCommands);
  </script>
</body>
</html>`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // API routes
    if (path.startsWith('/api/')) {
      return handleAPI(request, env, path);
    }

    // Serve dashboard HTML for all other routes
    return new Response(serveHTML(), {
      headers: { 'Content-Type': 'text/html', ...CORS_HEADERS }
    });
  }
};
