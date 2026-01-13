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
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers
} from '@whiskeysockets/baileys'

import { makeWASocketExtended, protoType, serialize } from './lib/simple.js'
import FirebaseDB from './lib/firebase.js'

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

const phoneNumberFromEnv = process.env.PHONE_NUMBER

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

// Auth state
const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
const { version } = await fetchLatestBaileysVersion()

console.log(chalk.blue(`[INFO] Using Baileys version: ${version.join('.')}`))

// Connection options
const connectionOptions = {
  version,
  logger: pino({ level: 'fatal' }),
  printQRInTerminal: false,
  browser: Browsers.ubuntu('NEXUS-MD'),
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

// Handle pairing code
if (!conn.authState.creds.registered) {
  let phoneNumber
  
  if (phoneNumberFromEnv) {
    phoneNumber = phoneNumberFromEnv.replace(/[^0-9]/g, '')
    
    if (!phoneNumber || phoneNumber.length < 8) {
      console.log(chalk.red("Invalid phone number format. Please include country code (Example: 1234567890)"))
      process.exit(0)
    }
  } else {
    console.log(chalk.red("No phone number provided. Please set the PHONE_NUMBER environment variable."))
    console.log(chalk.yellow("Example: PHONE_NUMBER=1234567890 npm start"))
    process.exit(0)
  }

  setTimeout(async () => {
    try {
      let code = await conn.requestPairingCode(phoneNumber)
      code = code?.match(/.{1,4}/g)?.join('-') || code
      
      console.log(chalk.green('\n╔═══════════════════════════════════════╗'))
      console.log(chalk.green('║         📲 PAIRING CODE               ║'))
      console.log(chalk.green('╠═══════════════════════════════════════╣'))
      console.log(chalk.green(`║     ${chalk.white.bold(code)}                  ║`))
      console.log(chalk.green('╠═══════════════════════════════════════╣'))
      console.log(chalk.green('║  1. Open WhatsApp on your phone       ║'))
      console.log(chalk.green('║  2. Go to Settings > Linked Devices   ║'))
      console.log(chalk.green('║  3. Tap "Link a Device"               ║'))
      console.log(chalk.green('║  4. Enter the code above              ║'))
      console.log(chalk.green('╚═══════════════════════════════════════╝\n'))
    } catch (error) {
      console.log(chalk.red("Failed to generate pairing code:"), error.message)
    }
  }, 3000)
}

console.log(chalk.yellow('\n[INFO] Waiting for connection...\n'))

// Connection update handler
async function connectionUpdate(update) {
  const { connection, lastDisconnect, isNewLogin } = update
  global.stopped = connection

  if (isNewLogin) conn.isInit = true

  const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode

  if (code && code !== DisconnectReason.loggedOut && conn?.ws?.socket == null) {
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
    const { jid, name } = conn.user
    console.log(chalk.green(`\n[SUCCESS] Connected as ${name || jid}`))
    console.log(chalk.cyan('\n🤖 NEXUS-MD is now online!\n'))
    
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
