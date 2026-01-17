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
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  delay,
  fetchLatestBaileysVersion,
  initAuthCreds
} from '@whiskeysockets/baileys'

import { makeWASocketExtended, protoType, serialize } from './lib/simple.js'
import FirebaseDB from './lib/firebase.js'
import { useFirebaseAuthState, clearFirebaseAuthState } from './lib/auth/firebase-auth.js'
import { createServer, pairingState } from './server.js'

dotenv.config()

const requestPairingCodeWrapper = async (num) => {
  if (global.requestPairingCode) return await global.requestPairingCode(num)
  throw new Error('Bot not initialized')
}
createServer(null, requestPairingCodeWrapper)

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
const groupMetadataCache = new NodeCache({ stdTTL: 5 * 60, useClones: false })

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

let state, saveCreds
const useFirebase = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY

if (useFirebase) {
  const firebaseAuth = await useFirebaseAuthState()
  state = firebaseAuth.state
  saveCreds = firebaseAuth.saveCreds
} else {
  const fileAuth = await useMultiFileAuthState('./auth_info')
  state = fileAuth.state
  saveCreds = fileAuth.saveCreds
}

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
    version: version || [2, 3000, 1015901307]
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
    console.log(chalk.red(`Connection closed. Reason: ${code}`))
    if (code === DisconnectReason.loggedOut || code === 405) {
      if (code === DisconnectReason.loggedOut) {
        if (useFirebase) await clearFirebaseAuthState()
        else try { rmSync('./auth_info', { recursive: true, force: true }) } catch {}
      }
      process.exit(0)
    } else {
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
          await delay(2000)
        }
      } catch (e) {}
      global.conn = makeWASocketExtended(getConnectionOptions())
    }

    const conn = global.conn

    conn.ev.off('messages.upsert', conn.handler)
    conn.ev.off('group-participants.update', conn.participantsUpdate)
    conn.ev.off('groups.update', conn.groupsUpdate)
    conn.ev.off('message.delete', conn.onDelete)
    conn.ev.off('presence.update', conn.presenceUpdate)
    conn.ev.off('connection.update', conn.connectionUpdate)
    conn.ev.off('creds.update', conn.credsUpdate)

    conn.handler = handler.handler.bind(conn)
    conn.participantsUpdate = handler.participantsUpdate.bind(conn)
    conn.groupsUpdate = handler.groupsUpdate.bind(conn)
    conn.onDelete = handler.deleteUpdate.bind(conn)
    conn.presenceUpdate = handler.presenceUpdate.bind(conn)
    conn.connectionUpdate = connectionUpdate.bind(conn)
    conn.credsUpdate = saveCreds.bind(conn)

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

process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

const shutdown = async () => {
  console.log(chalk.yellow('Shutting down...'))
  if (global.db.data) await global.db.write()
  if (global.conn?.ws) global.conn.ws.close()
  process.exit(0)
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
