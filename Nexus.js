process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './config.js'

import dotenv from 'dotenv'
import { existsSync, readFileSync, readdirSync, watch, rmSync } from 'fs'
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
  DisconnectReason,
  makeCacheableSignalKeyStore,
  delay,
  fetchLatestBaileysVersion,
  initAuthCreds
} from '@whiskeysockets/baileys'

import { makeWASocketExtended, protoType, serialize } from './lib/simple.js'
import FirebaseDB from './lib/firebase.js'
import { useFirebaseAuthState, clearFirebaseAuthState, flushAuthQueue } from './lib/auth/firebase-auth.js'
import { createServer, pairingState } from './server.js'

dotenv.config()

if (process.env.PORT) {
  const requestPairingCodeWrapper = async (num) => {
    if (global.requestPairingCode) return await global.requestPairingCode(num)
    throw new Error('Bot not initialized')
  }
  try {
    createServer(null, requestPairingCodeWrapper)
  } catch (e) {
    console.error('Failed to start web server:', e)
  }
}

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? (/file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL) : pathToFileURL(pathURL).toString()
}
global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true))
}
global.__require = function require(dir = import.meta.url) {
  return createRequire(dir)
}

const MAIN_LOGGER = pino({ level: 'fatal' })
const msgRetryCounterCache = new NodeCache()
const messageCache = new NodeCache({ stdTTL: 5 * 60, useClones: false })

const __dirname_current = global.__dirname(import.meta.url)
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())

protoType()
serialize()

global.timestamp = { start: new Date() }

const firebaseDB = new FirebaseDB()
await firebaseDB.connect()
global.db = firebaseDB

global.loadDatabase = async function loadDatabase() {
  await global.db.read()
  if (!global.db.data) global.db.data = {}
  if (!global.db.data.users) global.db.data.users = {}
  if (!global.db.data.chats) global.db.data.chats = {}
  if (!global.db.data.settings) global.db.data.settings = {}
  if (!global.db.data.stats) global.db.data.stats = {}
}
await global.loadDatabase()

setInterval(async () => {
  if (global.db.data) await global.db.write()
}, 60 * 1000)

const { state, saveCreds } = await useFirebaseAuthState()

let version
async function getLatestVersion() {
  try {
    const v = await fetchLatestBaileysVersion()
    return v.version
  } catch {
    return null
  }
}
version = await getLatestVersion()

function getConnectionOptions() {
  return {
    logger: MAIN_LOGGER,
    printQRInTerminal: false,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, MAIN_LOGGER)
    },
    markOnlineOnConnect: true,
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
    connectTimeoutMs: 60000,
    msgRetryCounterCache,
    version: version || [2, 3000, 1015901307],
    getMessage: async (key) => {
      if (messageCache) {
        const msg = await messageCache.get(key.id)
        if (msg) return msg.message
      }
      return {
        conversation: 'NEXUS-MD Decryption Placeholder'
      }
    }
  }
}

let isReloading = false
global.conn = makeWASocketExtended(getConnectionOptions())

global.requestPairingCode = async function(phoneNumber) {
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '')
  if (!cleanNumber || cleanNumber.length < 8) throw new Error('Invalid phone number')
  if (global.conn?.authState?.creds?.registered) throw new Error('Already registered')
  
  if (!global.conn?.ws || global.conn.ws.readyState !== 1) {
    await global.reloadHandler(true)
    await delay(5000)
  }
  return await global.conn.requestPairingCode(cleanNumber)
}

async function connectionUpdate(update) {
  const { connection, lastDisconnect } = update
  const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode

  if (connection === 'close') {
    const reason = code || 'Unknown'
    const error = lastDisconnect?.error
    console.log(chalk.red(`[ CONNECTION CLOSED ] Reason: ${reason}`))
    if (error) console.error(chalk.red(`[ CONNECTION ERROR ]`), error)

    if (code === DisconnectReason.loggedOut || code === 405) {
      console.log(chalk.yellow(`[ SESSION TERMINATED ] Logged out or session expired. Clearing data...`))
      if (code === DisconnectReason.loggedOut) {
        await clearFirebaseAuthState()
      }
      process.exit(0)
    } else if (code === 515) {
      console.log(chalk.blue(`[ STREAM ERROR 515 ] Reconnecting after delay...`))
      await delay(5000)
      await global.reloadHandler(true)
    } else {
      console.log(chalk.blue(`[ RECONNECTING ] Attempting to restart after delay...`))
      await delay(5000)
      await global.reloadHandler(true)
    }
  } else if (connection === 'open') {
    pairingState.status = 'connected'
    pairingState.connectedUser = { jid: this.user.id, name: this.user.name }
    console.log(chalk.green(`Connected as ${this.user.name || this.user.id}`))
  }
}

let handler = await import('./handler.js')

global.reloadHandler = async function(restartConn) {
  if (isReloading) return
  isReloading = true

  try {
    const Handler = await import(`./handler.js?update=${Date.now()}`).catch(() => null)
    if (Handler) handler = Handler

    if (restartConn && global.conn) {
      try {
        const oldConn = global.conn
        oldConn.ev.removeAllListeners()
        if (oldConn.ws) {
          oldConn.ws.terminate()
        }
        global.conn = null
        await delay(3000)
      } catch (e) {}
      global.conn = makeWASocketExtended(getConnectionOptions())
    }

    const conn = global.conn

    if (conn.handler) conn.ev.off('messages.upsert', conn.handler)
    if (conn.participantsUpdate) conn.ev.off('group-participants.update', conn.participantsUpdate)
    if (conn.groupsUpdate) conn.ev.off('groups.update', conn.groupsUpdate)
    if (conn.onDelete) conn.ev.off('message.delete', conn.onDelete)
    if (conn.presenceUpdate) conn.ev.off('presence.update', conn.presenceUpdate)
    if (conn.connectionUpdate) conn.ev.off('connection.update', conn.connectionUpdate)
    if (conn.credsUpdate) conn.ev.off('creds.update', conn.credsUpdate)

    conn.handler = handler.handler.bind(conn)
    conn.participantsUpdate = handler.participantsUpdate.bind(conn)
    conn.groupsUpdate = handler.groupsUpdate.bind(conn)
    conn.onDelete = handler.deleteUpdate.bind(conn)
    conn.presenceUpdate = handler.presenceUpdate.bind(conn)
    conn.connectionUpdate = connectionUpdate.bind(conn)
    conn.credsUpdate = saveCreds.bind(conn)

    conn.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {
        if (!msg.message) continue
        messageCache.set(msg.key.id, msg)
      }
    })
    conn.ev.on('messages.upsert', conn.handler)
    conn.ev.on('group-participants.update', conn.participantsUpdate)
    conn.ev.on('groups.update', conn.groupsUpdate)
    conn.ev.on('message.delete', conn.onDelete)
    conn.ev.on('presence.update', conn.presenceUpdate)
    conn.ev.on('connection.update', conn.connectionUpdate)
    conn.ev.on('creds.update', conn.credsUpdate)

  } catch (error) {
    console.error(error)
  } finally {
    isReloading = false
  }
}

await global.reloadHandler()

const pluginFolder = join(__dirname_current, 'plugins/index')
global.plugins = {}
async function loadPlugins() {
  for (const filename of readdirSync(pluginFolder).filter(f => f.endsWith('.js'))) {
    try {
      const m = await import(global.__filename(join(pluginFolder, filename)) + `?update=${Date.now()}`)
      global.plugins[filename] = m.default || m
    } catch (e) {
      console.error(e)
    }
  }
}
await loadPlugins()

global.reload = async (_ev, filename) => {
  if (filename.endsWith('.js')) {
    const dir = join(pluginFolder, filename)
    if (existsSync(dir)) {
      try {
        const m = await import(global.__filename(dir) + `?update=${Date.now()}`)
        global.plugins[filename] = m.default || m
        console.log(chalk.blue(`Plugin updated: ${filename}`))
      } catch (e) {
        console.error(e)
      }
    } else {
      delete global.plugins[filename]
      console.log(chalk.yellow(`Plugin deleted: ${filename}`))
    }
  }
}
watch(pluginFolder, global.reload)

process.on('uncaughtException', (err) => {
  console.error(chalk.red('[ UNCAUGHT EXCEPTION ]'), err)
})
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('[ UNHANDLED REJECTION ]'), 'at:', promise, 'reason:', reason)
})

const shutdown = async (signal) => {
  console.log(chalk.yellow(`[ SHUTDOWN ] Received ${signal}. Saving data and closing connection...`))
  try {
    if (global.db.data) {
      await global.db.write()
      console.log(chalk.green('[ SHUTDOWN ] Database saved successfully.'))
    }

    // Ensure all auth writes are flushed to Firebase
    await flushAuthQueue()
    console.log(chalk.green('[ SHUTDOWN ] Auth state flushed.'))

    if (global.conn?.ws) {
      global.conn.ws.terminate()
      console.log(chalk.green('[ SHUTDOWN ] Connection terminated.'))
    }
  } catch (e) {
    console.error(chalk.red('[ SHUTDOWN ERROR ]'), e)
  }
  process.exit(0)
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
