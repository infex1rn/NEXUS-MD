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
    this.data = {
      users: {},
      chats: {},
      settings: {},
      stats: {}
    }
    this.db = null
    this.collections = {
      users: 'users',
      chats: 'chats',
      settings: 'settings',
      stats: 'stats'
    }
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
    
    try {
      // Read users
      const usersSnapshot = await this.db.collection(this.collections.users).get()
      usersSnapshot.forEach(doc => {
        this.data.users[doc.id] = restoreFromFirebase(doc.data())
      })
      
      // Read chats
      const chatsSnapshot = await this.db.collection(this.collections.chats).get()
      chatsSnapshot.forEach(doc => {
        this.data.chats[doc.id] = restoreFromFirebase(doc.data())
      })
      
      // Read settings
      const settingsSnapshot = await this.db.collection(this.collections.settings).get()
      settingsSnapshot.forEach(doc => {
        this.data.settings[doc.id] = restoreFromFirebase(doc.data())
      })
      
      // Read stats
      const statsSnapshot = await this.db.collection(this.collections.stats).get()
      statsSnapshot.forEach(doc => {
        this.data.stats[doc.id] = restoreFromFirebase(doc.data())
      })
      
      console.log('[Firebase] Data loaded successfully')
      return this.data
    } catch (error) {
      console.error('[Firebase] Read error:', error.message)
      return this.data
    }
  }
  
  /**
   * Write all data to Firebase
   */
  async write() {
    if (!this.db) return false
    
    try {
      const batch = this.db.batch()
      
      // Write users
      for (const [id, data] of Object.entries(this.data.users)) {
        const ref = this.db.collection(this.collections.users).doc(id.replace(/[\/\.]/g, '_'))
        batch.set(ref, { ...prepareForFirebase(data), _id: id }, { merge: true })
      }
      
      // Write chats
      for (const [id, data] of Object.entries(this.data.chats)) {
        const ref = this.db.collection(this.collections.chats).doc(id.replace(/[\/\.]/g, '_'))
        batch.set(ref, { ...prepareForFirebase(data), _id: id }, { merge: true })
      }
      
      // Write settings
      for (const [id, data] of Object.entries(this.data.settings)) {
        const ref = this.db.collection(this.collections.settings).doc(id.replace(/[\/\.]/g, '_'))
        batch.set(ref, { ...prepareForFirebase(data), _id: id }, { merge: true })
      }
      
      // Write stats
      for (const [id, data] of Object.entries(this.data.stats)) {
        const ref = this.db.collection(this.collections.stats).doc(id.replace(/[\/\.]/g, '_'))
        batch.set(ref, { ...prepareForFirebase(data), _id: id }, { merge: true })
      }
      
      await batch.commit()
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
    if (this.data.users[jid]) return this.data.users[jid]
    
    if (this.db) {
      try {
        const doc = await this.db.collection(this.collections.users).doc(jid.replace(/[\/\.]/g, '_')).get()
        if (doc.exists) {
          this.data.users[jid] = restoreFromFirebase(doc.data())
          return this.data.users[jid]
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
    this.data.users[jid] = { ...this.data.users[jid], ...data }
    
    if (this.db) {
      try {
        await this.db.collection(this.collections.users).doc(jid.replace(/[\/\.]/g, '_')).set(
          { ...prepareForFirebase(this.data.users[jid]), _id: jid },
          { merge: true }
        )
      } catch (error) {
        console.error('[Firebase] Set user error:', error.message)
      }
    }
    
    return this.data.users[jid]
  }
  
  /**
   * Get a chat by JID
   */
  async getChat(jid) {
    if (this.data.chats[jid]) return this.data.chats[jid]
    
    if (this.db) {
      try {
        const doc = await this.db.collection(this.collections.chats).doc(jid.replace(/[\/\.]/g, '_')).get()
        if (doc.exists) {
          this.data.chats[jid] = restoreFromFirebase(doc.data())
          return this.data.chats[jid]
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
    this.data.chats[jid] = { ...this.data.chats[jid], ...data }
    
    if (this.db) {
      try {
        await this.db.collection(this.collections.chats).doc(jid.replace(/[\/\.]/g, '_')).set(
          { ...prepareForFirebase(this.data.chats[jid]), _id: jid },
          { merge: true }
        )
      } catch (error) {
        console.error('[Firebase] Set chat error:', error.message)
      }
    }
    
    return this.data.chats[jid]
  }
  
  /**
   * Update stats
   */
  async updateStats(pluginName, success = true) {
    const now = Date.now()
    
    if (!this.data.stats[pluginName]) {
      this.data.stats[pluginName] = {
        total: 0,
        success: 0,
        last: now
      }
    }
    
    this.data.stats[pluginName].total += 1
    this.data.stats[pluginName].last = now
    if (success) {
      this.data.stats[pluginName].success += 1
    }
    
    if (this.db) {
      try {
        await this.db.collection(this.collections.stats).doc(pluginName.replace(/[\/\.]/g, '_')).set(
          { ...prepareForFirebase(this.data.stats[pluginName]), _id: pluginName },
          { merge: true }
        )
      } catch (error) {
        console.error('[Firebase] Update stats error:', error.message)
      }
    }
    
    return this.data.stats[pluginName]
  }
}

export default FirebaseDB
