/**
 * Firebase Database Module for NEXUS-MD
 * Handles all database operations using Firebase Firestore
 */
import admin from 'firebase-admin'
import fs from 'fs'

let db = null
let initialized = false

/**
 * Initialize Firebase Admin SDK
 */
export async function initFirebase() {
  if (initialized) return db
  
  try {
    // Check for service account file or environment variables
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json'
    
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      // Initialize using environment variables
      const config = {
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      }
      // databaseURL is only needed for Realtime Database, not Firestore
      if (process.env.FIREBASE_DATABASE_URL) {
        config.databaseURL = process.env.FIREBASE_DATABASE_URL
      }
      admin.initializeApp(config)
      console.log('[Firebase] Initialized using environment variables (Firestore)')
    } else if (fs.existsSync(serviceAccountPath)) {
      // Initialize using service account file
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
      const config = {
        credential: admin.credential.cert(serviceAccount)
      }
      // databaseURL is only needed for Realtime Database, not Firestore
      if (process.env.FIREBASE_DATABASE_URL) {
        config.databaseURL = process.env.FIREBASE_DATABASE_URL
      }
      admin.initializeApp(config)
      console.log('[Firebase] Initialized using service account file (Firestore)')
    } else {
      console.warn('[Firebase] No credentials found. Using in-memory database fallback.')
      return null
    }
    
    db = admin.firestore()
    initialized = true
    
    console.log('[Firebase] Firestore connected successfully')
    return db
  } catch (error) {
    console.error('[Firebase] Initialization error:', error.message)
    return null
  }
}

/**
 * Convert Buffer to base64 string for Firebase storage
 * @param {Object} obj Object potentially containing Buffer values
 * @returns {Object} Object with base64 strings instead of Buffers
 */
export function prepareForFirebase(obj) {
  if (typeof obj === 'function') return undefined
  if (!obj || typeof obj !== 'object') return obj

  if (Buffer.isBuffer(obj)) {
    return { _type: 'Buffer', data: obj.toString('base64') }
  }

  if (ArrayBuffer.isView(obj) || obj instanceof ArrayBuffer) {
    return { _type: 'Buffer', data: Buffer.from(obj).toString('base64') }
  }

  if (Array.isArray(obj)) {
    return obj.map(item => prepareForFirebase(item)).filter(item => item !== undefined)
  }

  const result = {}
  for (const key in obj) {
    const val = prepareForFirebase(obj[key])
    if (val !== undefined) {
      result[key] = val
    }
  }

  return result
}

/**
 * Convert base64 strings back to Buffer from Firebase storage
 * @param {Object} obj Object potentially containing base64 encoded values
 * @returns {Object} Object with Buffers restored
 */
export function restoreFromFirebase(obj) {
  if (!obj || typeof obj !== 'object') return obj

  // Check if this is a serialized Buffer
  if (obj._type === 'Buffer' && typeof obj.data === 'string') {
    return Buffer.from(obj.data, 'base64')
  }

  if (Array.isArray(obj)) {
    return obj.map(item => restoreFromFirebase(item))
  }

  const result = {}
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = restoreFromFirebase(obj[key])
    }
  }

  return result
}

/**
 * Firebase Database class for NEXUS-MD
 */
export class FirebaseDB {
  constructor() {
    this._data = {
      users: {},
      chats: {},
      settings: {},
      stats: {}
    }

    this.dirty = {
      users: new Set(),
      chats: new Set(),
      settings: new Set(),
      stats: new Set()
    }

    this.loading = false

    this.data = {
      users: this._createProxy('users'),
      chats: this._createProxy('chats'),
      settings: this._createProxy('settings'),
      stats: this._createProxy('stats')
    }

    this.db = null
    this.collections = {
      users: 'users',
      chats: 'chats',
      settings: 'settings',
      stats: 'stats'
    }
  }

  _createProxy(collection) {
    const self = this
    return new Proxy(this._data[collection], {
      get: (target, prop) => {
        if (!self.loading && typeof prop === 'string' && !['toJSON', 'constructor', 'length', 'prototype'].includes(prop)) {
          self.dirty[collection].add(prop)
        }
        return target[prop]
      },
      set: (target, prop, value) => {
        if (!self.loading && typeof prop === 'string') {
          self.dirty[collection].add(prop)
        }
        target[prop] = value
        return true
      }
    })
  }
  
  /**
   * Connect to Firebase
   */
  async connect() {
    this.db = await initFirebase()
    if (this.db) {
      await this.read()
    }
    return this.db !== null
  }
  
  /**
   * Read all data from Firebase
   */
  async read() {
    if (!this.db) {
      console.log('[Firebase] Using in-memory database')
      return this.data
    }
    
    this.loading = true
    try {
      // Read users
      const usersSnapshot = await this.db.collection(this.collections.users).get()
      usersSnapshot.forEach(doc => {
        const data = doc.data()
        const id = data._id || doc.id
        this._data.users[id] = restoreFromFirebase(data)
      })
      
      // Read chats
      const chatsSnapshot = await this.db.collection(this.collections.chats).get()
      chatsSnapshot.forEach(doc => {
        const data = doc.data()
        const id = data._id || doc.id
        this._data.chats[id] = restoreFromFirebase(data)
      })
      
      // Read settings
      const settingsSnapshot = await this.db.collection(this.collections.settings).get()
      settingsSnapshot.forEach(doc => {
        const data = doc.data()
        const id = data._id || doc.id
        this._data.settings[id] = restoreFromFirebase(data)
      })
      
      // Read stats
      const statsSnapshot = await this.db.collection(this.collections.stats).get()
      statsSnapshot.forEach(doc => {
        const data = doc.data()
        const id = data._id || doc.id
        this._data.stats[id] = restoreFromFirebase(data)
      })
      
      console.log('[Firebase] Data loaded successfully')
      return this.data
    } catch (error) {
      console.error('[Firebase] Read error:', error.message)
      return this.data
    } finally {
      this.loading = false
      // Clear dirty sets after initial read
      for (const collection in this.dirty) {
        this.dirty[collection].clear()
      }
    }
  }
  
  /**
   * Write all data to Firebase
   */
  async write() {
    if (!this.db) return false
    
    try {
      const allOps = []
      
      // Prepare only dirty records for writing
      for (const collection of Object.keys(this.dirty)) {
        for (const id of this.dirty[collection]) {
          const data = this._data[collection][id]
          if (data) {
            const ref = this.db.collection(this.collections[collection]).doc(id.replace(/[\/\.]/g, '_'))
            allOps.push({ ref, data: { ...prepareForFirebase(data), _id: id } })
          }
        }
      }

      if (allOps.length === 0) return true

      // Execute in chunks of 500 (Firestore limit)
      for (let i = 0; i < allOps.length; i += 500) {
        const batch = this.db.batch()
        const chunk = allOps.slice(i, i + 500)
        for (const op of chunk) {
          batch.set(op.ref, op.data, { merge: true })
        }
        await batch.commit()
      }
      
      // Clear dirty sets after successful write
      for (const collection in this.dirty) {
        this.dirty[collection].clear()
      }

      console.log(`[Firebase] Successfully wrote ${allOps.length} dirty records`)
      return true
    } catch (error) {
      console.error('[Firebase] Write error:', error.message)
      return false
    }
  }
  
  /**
   * Get a user by JID
   */
  async getUser(jid) {
    if (this._data.users[jid]) return this._data.users[jid]
    
    if (this.db) {
      try {
        const doc = await this.db.collection(this.collections.users).doc(jid.replace(/[\/\.]/g, '_')).get()
        if (doc.exists) {
          this._data.users[jid] = restoreFromFirebase(doc.data())
          return this._data.users[jid]
        }
      } catch (error) {
        console.error('[Firebase] Get user error:', error.message)
      }
    }
    
    return null
  }
  
  /**
   * Set user data
   */
  async setUser(jid, data) {
    this._data.users[jid] = { ...this._data.users[jid], ...data }
    this.dirty.users.add(jid)
    
    if (this.db) {
      try {
        await this.db.collection(this.collections.users).doc(jid.replace(/[\/\.]/g, '_')).set(
          { ...prepareForFirebase(this._data.users[jid]), _id: jid },
          { merge: true }
        )
        this.dirty.users.delete(jid)
      } catch (error) {
        console.error('[Firebase] Set user error:', error.message)
      }
    }
    
    return this._data.users[jid]
  }
  
  /**
   * Get a chat by JID
   */
  async getChat(jid) {
    if (this._data.chats[jid]) return this._data.chats[jid]
    
    if (this.db) {
      try {
        const doc = await this.db.collection(this.collections.chats).doc(jid.replace(/[\/\.]/g, '_')).get()
        if (doc.exists) {
          this._data.chats[jid] = restoreFromFirebase(doc.data())
          return this._data.chats[jid]
        }
      } catch (error) {
        console.error('[Firebase] Get chat error:', error.message)
      }
    }
    
    return null
  }
  
  /**
   * Set chat data
   */
  async setChat(jid, data) {
    this._data.chats[jid] = { ...this._data.chats[jid], ...data }
    this.dirty.chats.add(jid)
    
    if (this.db) {
      try {
        await this.db.collection(this.collections.chats).doc(jid.replace(/[\/\.]/g, '_')).set(
          { ...prepareForFirebase(this._data.chats[jid]), _id: jid },
          { merge: true }
        )
        this.dirty.chats.delete(jid)
      } catch (error) {
        console.error('[Firebase] Set chat error:', error.message)
      }
    }
    
    return this._data.chats[jid]
  }
  
  /**
   * Update stats
   */
  async updateStats(pluginName, success = true) {
    const now = Date.now()
    
    if (!this._data.stats[pluginName]) {
      this._data.stats[pluginName] = {
        total: 0,
        success: 0,
        last: now
      }
    }
    
    this._data.stats[pluginName].total += 1
    this._data.stats[pluginName].last = now
    if (success) {
      this._data.stats[pluginName].success += 1
    }
    
    this.dirty.stats.add(pluginName)

    if (this.db) {
      try {
        await this.db.collection(this.collections.stats).doc(pluginName.replace(/[\/\.]/g, '_')).set(
          { ...prepareForFirebase(this._data.stats[pluginName]), _id: pluginName },
          { merge: true }
        )
        this.dirty.stats.delete(pluginName)
      } catch (error) {
        console.error('[Firebase] Update stats error:', error.message)
      }
    }
    
    return this._data.stats[pluginName]
  }
}

export default FirebaseDB
