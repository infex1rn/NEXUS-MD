process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './config.js'

import dotenv from 'dotenv'
import { existsSync, readFileSync, readdirSync, watch } from 'fs'
import { createRequire } from 'module'
import path, { join } from 'path'
import { platform } from 'process'
import { fileURLToPath, pathToFileURL } from 'url'
import NodeCache from 'node-cache'
import chalk from 'chalk'
import pino from 'pino'
import yargs from 'yargs'
import syntaxerror from 'syntax-error'
import { format } from 'util'

import {
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  delay,
  fetchLatestBaileysVersion
} from 'baileys-pro'

import { makeWASocketExtended, protoType, serialize } from './lib/simple.js'
import FirebaseDB from './lib/firebase.js'
import { useFirebaseAuthState } from './lib/auth/firebase-auth.js'
import { createServer, pairingState } from './server.js'

dotenv.config()

// Global path helpers
global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix
    ? /file:\/\/\//.test(pathURL)
      ? fileURLToPath(pathURL)
      : pathURL
    : pathToFileURL(pathURL).toString()
}
global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true))
}
global.__require = function require(dir = import.meta.url) {
  return createRequire(dir)
}

const MAIN_LOGGER = pino({ timestamp: () => `,"time":"${new Date().toJSON()}"` })
const logger = MAIN_LOGGER.child({})
logger.level = 'fatal'

const msgRetryCounterCache = new NodeCache()
const groupMetadataCache = new NodeCache({ stdTTL: 5 * 60, useClones: false })

const __dirname_current = global.__dirname(import.meta.url)
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())

// Initialize proto types
protoType()
serialize()

// Global timestamp
global.timestamp = {
  start: new Date(),
}

// Initialize Firebase Database
console.log(chalk.blue('[INFO] Initializing Firebase database...'))
const firebaseDB = new FirebaseDB()
await firebaseDB.connect()

global.db = firebaseDB

global.loadDatabase = async function loadDatabase() {
  await global.db.read()
  global.db.data = {
    users: {},
    chats: {},
    settings: {},
    stats: {},
    ...(global.db.data || {})
  }
}

await global.loadDatabase()

// Auto-save database every 60 seconds
setInterval(async () => {
  if (global.db.data) {
    await global.db.write()
  }
}, 60 * 1000)

/**
 * Print NEXUS-MD banner
 */
function printBanner() {
  console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗             ║
║   ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝             ║
║   ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗             ║
║   ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║             ║
║   ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║             ║
║   ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝             ║
║                     ${chalk.white('NEXUS-MD v1.0.0')}                        ║
║               ${chalk.gray('Multi-Device WhatsApp Bot')}                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `))
}

printBanner()

// Auth state - Use Firebase for session storage if available, fallback to file-based
let state, saveCreds

// Check if Firebase is configured
const useFirebase = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY

if (useFirebase) {
  console.log(chalk.blue('[INFO] Using Firebase for session storage'))
  const firebaseAuth = await useFirebaseAuthState()
  state = firebaseAuth.state
  saveCreds = firebaseAuth.saveCreds
} else {
  console.log(chalk.yellow('[INFO] Firebase not configured, using file-based session storage'))
  console.log(chalk.yellow('[INFO] Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY for cloud session storage'))
  const fileAuth = await useMultiFileAuthState('./auth_info')
  state = fileAuth.state
  saveCreds = fileAuth.saveCreds
}

// Fetch the latest WhatsApp Web version dynamically to avoid 405 errors
// WhatsApp frequently updates their protocol, causing hardcoded versions to fail
let version
try {
  const versionInfo = await fetchLatestBaileysVersion()
  version = versionInfo.version
  console.log(chalk.blue(`[INFO] Using WhatsApp Web version: ${version.join('.')} (latest: ${versionInfo.isLatest})`))
} catch (error) {
  // Fallback version if fetch fails - this should be updated periodically
  version = [2, 3000, 1015901307]
  console.log(chalk.yellow(`[WARN] Failed to fetch latest version, using fallback: ${version.join('.')}`))
}

/**
 * Get browser configuration for pairing code compatibility
 * Uses Ubuntu Chrome format which is proven to work with pairing codes
 * Based on working implementations from GURU-Ai and other WhatsApp bot projects
 * @returns {Array} Browser configuration array for Baileys
 */
function getBrowserConfig() {
  // Use Ubuntu Chrome format - this is proven to work with pairing codes
  // Format: [platform, browser, version] matching GURU-Ai's working configuration
  const browserConfig = ['Ubuntu', 'Chrome', '20.0.04']
  
  console.log(chalk.blue(`[INFO] Browser platform: Ubuntu Chrome 20.0.04`))
  
  return browserConfig
}

// Connection options
const connectionOptions = {
  version,
  logger: pino({ level: 'fatal' }),
  printQRInTerminal: false,
  browser: getBrowserConfig(),
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }))
  },
  markOnlineOnConnect: true,
  generateHighQualityLinkPreview: true,
  cachedGroupMetadata: async (jid) => {
    const cached = groupMetadataCache.get(jid)
    if (cached) return cached
    return null
  },
  getMessage: async (key) => {
    return { conversation: '' }
  },
  msgRetryCounterCache,
  syncFullHistory: false
}

// Create socket
global.conn = makeWASocketExtended(connectionOptions)
conn.isInit = false

// Function to request pairing code (used by both terminal and web interface)
async function requestPairingCode(phoneNumber) {
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '')
  
  if (!cleanNumber || cleanNumber.length < 8) {
    throw new Error('Invalid phone number format. Please include country code (Example: 1234567890)')
  }
  
  // Check if already registered
  if (conn.authState?.creds?.registered) {
    throw new Error('Device is already registered. Please unlink first.')
  }
  
  try {
    // Wait for socket to be ready before requesting pairing code
    // This delay is critical for the pairing code to work properly
    // Using 3000ms based on GURU-Ai's working implementation
    await delay(3000)
    
    // Pass a session identifier to requestPairingCode for better pairing reliability
    // The second parameter is an optional session name/identifier
    // Using global.botname which is defined in config.js
    const sessionId = (global.botname || 'NEXUSMD').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase()
    const code = await conn.requestPairingCode(cleanNumber, sessionId)
    const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code
    
    console.log(chalk.green('\n╔═══════════════════════════════════════╗'))
    console.log(chalk.green('║         📲 PAIRING CODE               ║'))
    console.log(chalk.green('╠═══════════════════════════════════════╣'))
    console.log(chalk.green(`║     ${chalk.white.bold(formattedCode)}                  ║`))
    console.log(chalk.green('╠═══════════════════════════════════════╣'))
    console.log(chalk.green('║  1. Open WhatsApp on your phone       ║'))
    console.log(chalk.green('║  2. Go to Settings > Linked Devices   ║'))
    console.log(chalk.green('║  3. Tap "Link a Device"               ║'))
    console.log(chalk.green('║  4. Enter the code above              ║'))
    console.log(chalk.green('╚═══════════════════════════════════════╝\n'))
    
    return code
  } catch (error) {
    console.log(chalk.red("Failed to generate pairing code:"), error.message)
    throw error
  }
}

// Start web server for pairing and dashboard
createServer(conn, requestPairingCode)

// Only use web interface for pairing to avoid duplicate code generation conflicts
if (!conn.authState.creds.registered) {
  console.log(chalk.cyan("\n📱 Use the web interface to pair your device!\n"))
}

console.log(chalk.yellow('\n[INFO] Waiting for connection...\n'))

// Connection update handler
// Track reconnection attempts to prevent infinite loops
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5

async function connectionUpdate(update) {
  const { connection, lastDisconnect, isNewLogin } = update
  global.stopped = connection

  if (isNewLogin) conn.isInit = true

  const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode

  // Handle 405 error specifically - this means the WhatsApp version is outdated
  // or there's a protocol mismatch. Don't attempt infinite reconnects.
  if (code === 405) {
    reconnectAttempts++
    console.log(chalk.red(`\n[ERROR] Received 405 error (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`))
    console.log(chalk.yellow('[INFO] This usually means WhatsApp protocol has been updated.'))
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log(chalk.red('[ERROR] Max reconnection attempts reached for 405 error.'))
      console.log(chalk.yellow('[INFO] Please try the following:'))
      console.log(chalk.yellow('  1. Update the bot to the latest version'))
      console.log(chalk.yellow('  2. Clear auth_info folder and re-pair your device'))
      console.log(chalk.yellow('  3. Restart the application'))
      return // Stop trying to reconnect
    }
    
    // Wait before retrying with exponential backoff
    const waitTime = Math.min(30000, 5000 * reconnectAttempts)
    console.log(chalk.yellow(`[INFO] Waiting ${waitTime / 1000}s before retry...`))
    await delay(waitTime)
  }

  if (code && code !== DisconnectReason.loggedOut && code !== 405 && conn?.ws?.socket == null) {
    try {
      console.log(chalk.yellow('[INFO] Reconnecting...'))
      await global.reloadHandler(true)
    } catch (error) {
      console.error('Error reloading handler:', error)
    }
  }

  if (code && (code === DisconnectReason.restartRequired || code === 428)) {
    console.log(chalk.yellow('\n[INFO] Restart Required...'))
    await global.reloadHandler(true)
  }

  if (global.db.data == null) await loadDatabase()

  if (connection === 'open') {
    // Reset reconnect attempts on successful connection
    reconnectAttempts = 0
    
    const { jid, name } = conn.user
    console.log(chalk.green(`\n[SUCCESS] Connected as ${name || jid}`))
    console.log(chalk.cyan('\n🤖 NEXUS-MD is now online!\n'))
    
    // Update pairing state for web interface
    pairingState.status = 'connected'
    pairingState.connectedUser = { jid, name }
    
    // Send welcome message
    try {
      const welcomeMsg = `*🤖 NEXUS-MD BOT ONLINE*\n\nHello ${name || 'there'}! Your bot is now connected.\n\nType *.menu* to see available commands.`
      await conn.sendMessage(jid, { text: welcomeMsg })
    } catch (e) {
      console.error('Error sending welcome message:', e)
    }
  }

  if (connection === 'close') {
    console.log(chalk.red(`\n[DISCONNECTED] Connection closed. Reason: ${code}`))
    
    if (code === DisconnectReason.loggedOut) {
      console.log(chalk.red('[INFO] Logged out. Please delete auth_info folder and restart.'))
    }
  }
}

// Credentials update handler
conn.ev.on('creds.update', saveCreds)

// Load handler
let handler = await import('./handler.js')

global.reloadHandler = async function(restatConn) {
  try {
    const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error)
    if (Object.keys(Handler || {}).length) handler = Handler
  } catch (error) {
    console.error(error)
  }
  
  if (restatConn) {
    const oldChats = global.conn.chats
    try {
      global.conn.ws.close()
    } catch {}
    conn.ev.removeAllListeners()
    global.conn = makeWASocketExtended(connectionOptions, { chats: oldChats })
    isInit = true
  }
  
  if (!isInit) {
    conn.ev.off('messages.upsert', conn.handler)
    conn.ev.off('group-participants.update', conn.participantsUpdate)
    conn.ev.off('groups.update', conn.groupsUpdate)
    conn.ev.off('message.delete', conn.onDelete)
    conn.ev.off('presence.update', conn.presenceUpdate)
    conn.ev.off('connection.update', conn.connectionUpdate)
    conn.ev.off('creds.update', conn.credsUpdate)
  }

  // Welcome/bye messages
  conn.welcome = `Hello @user!\n\n🎉 *WELCOME* to the group @group!\n\n📜 Please read the *DESCRIPTION*: @desc`
  conn.bye = `👋 GOODBYE @user\n\nSee you later!`
  conn.spromote = `*@user* has been promoted to admin!`
  conn.sdemote = `*@user* is no longer an admin.`

  conn.handler = handler.handler.bind(global.conn)
  conn.participantsUpdate = handler.participantsUpdate.bind(global.conn)
  conn.groupsUpdate = handler.groupsUpdate.bind(global.conn)
  conn.onDelete = handler.deleteUpdate.bind(global.conn)
  conn.presenceUpdate = handler.presenceUpdate.bind(global.conn)
  conn.connectionUpdate = connectionUpdate.bind(global.conn)
  conn.credsUpdate = saveCreds.bind(global.conn)

  conn.ev.on('messages.upsert', conn.handler)
  conn.ev.on('group-participants.update', conn.participantsUpdate)
  conn.ev.on('groups.update', conn.groupsUpdate)
  conn.ev.on('message.delete', conn.onDelete)
  conn.ev.on('presence.update', conn.presenceUpdate)
  conn.ev.on('connection.update', conn.connectionUpdate)
  conn.ev.on('creds.update', conn.credsUpdate)
  
  isInit = false
  return true
}

let isInit = true

// Load plugins
const pluginFolder = global.__dirname(join(__dirname_current, './plugins/index'))
const pluginFilter = filename => /\.js$/.test(filename)
global.plugins = {}

async function filesInit() {
  for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
    try {
      const file = global.__filename(join(pluginFolder, filename))
      const module = await import(file)
      global.plugins[filename] = module.default || module
    } catch (e) {
      console.error(chalk.red(`[ERROR] Failed to load plugin: ${filename}`))
      console.error(e)
      delete global.plugins[filename]
    }
  }
}

filesInit()
  .then(_ => {
    console.log(chalk.green(`[INFO] Loaded ${Object.keys(global.plugins).length} plugins`))
  })
  .catch(console.error)

// Watch for plugin changes
global.reload = async (_ev, filename) => {
  if (pluginFilter(filename)) {
    const dir = global.__filename(join(pluginFolder, filename), true)
    if (filename in global.plugins) {
      if (existsSync(dir)) console.log(chalk.blue(`[INFO] Updated plugin - '${filename}'`))
      else {
        console.log(chalk.yellow(`[INFO] Deleted plugin - '${filename}'`))
        return delete global.plugins[filename]
      }
    } else console.log(chalk.green(`[INFO] New plugin - '${filename}'`))
    
    const err = syntaxerror(readFileSync(dir), filename, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true,
    })
    if (err) console.error(chalk.red(`[ERROR] Syntax error in '${filename}'\n${format(err)}`))
    else {
      try {
        const module = await import(`${global.__filename(dir)}?update=${Date.now()}`)
        global.plugins[filename] = module.default || module
      } catch (e) {
        console.error(chalk.red(`[ERROR] Error loading plugin '${filename}'\n${format(e)}'`))
      } finally {
        global.plugins = Object.fromEntries(
          Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b))
        )
      }
    }
  }
}

Object.freeze(global.reload)
watch(pluginFolder, global.reload)

await global.reloadHandler()

// Handle uncaught exceptions
process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)
