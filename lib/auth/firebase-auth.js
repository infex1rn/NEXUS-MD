/**
 * Firebase Auth State for Baileys
 * Stores WhatsApp session credentials in Firebase Firestore
 * Based on the MongoDB auth pattern from GURU-Ai
 */

import { initAuthCreds, proto } from '@whiskeysockets/baileys'
import { initFirebase } from '../firebase.js'

let firebaseDb = null

/**
 * Initialize Firebase connection
 */
async function getFirebaseDb() {
  if (!firebaseDb) {
    firebaseDb = await initFirebase()
  }
  return firebaseDb
}

/**
 * Convert Buffer to base64 string for Firebase storage
 * @param {Object} obj Object potentially containing Buffer values
 * @returns {Object} Object with base64 strings instead of Buffers
 */
function prepareForFirebase(obj) {
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
function restoreFromFirebase(obj) {
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
 * Stores Baileys authentication state in Firebase Firestore
 * @returns {Promise<{state: AuthenticationState, saveCreds: () => Promise<void>}>}
 */
export const useFirebaseAuthState = async () => {
  const db = await getFirebaseDb()
  
  if (!db) {
    console.warn('[Firebase Auth] Firebase not available, falling back to in-memory auth')
    // Return a basic in-memory auth state
    const creds = initAuthCreds()
    return {
      state: {
        creds,
        keys: {
          get: async () => ({}),
          set: async () => {}
        }
      },
      saveCreds: async () => {}
    }
  }
  
  const credsCollection = db.collection('auth_credentials')
  const keysCollection = db.collection('auth_keys')
  
  let creds
  try {
    const credsDoc = await credsCollection.doc('credentials').get()
    if (credsDoc.exists) {
      const data = credsDoc.data()
      // Remove the _id field we added for Firebase storage - it's not part of the Baileys creds structure
      // and would cause issues if passed to Baileys auth state
      delete data._id
      creds = restoreFromFirebase(data)
    } else {
      creds = initAuthCreds()
    }
  } catch (error) {
    console.error('[Firebase Auth] Error retrieving credentials:', error.message)
    creds = initAuthCreds()
  }
  
  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          try {
            const data = {}
            
            for (const id of ids) {
              const docId = `${type}_${id}`.replace(/[\/\.]/g, '_')
              const doc = await keysCollection.doc(docId).get()
              
              if (doc.exists) {
                let value = restoreFromFirebase(doc.data().value)
                
                // Special handling for app-state-sync-key
                if (type === 'app-state-sync-key' && value) {
                  value = proto.Message.AppStateSyncKeyData.fromObject(value)
                }
                
                data[id] = value
              }
            }
            
            return data
          } catch (error) {
            console.error('[Firebase Auth] Error retrieving keys:', error.message)
            return {}
          }
        },
        set: async (data) => {
          try {
            const batch = db.batch()
            
            for (const category in data) {
              for (const id in data[category]) {
                const value = data[category][id]
                const docId = `${category}_${id}`.replace(/[\/\.]/g, '_')
                const ref = keysCollection.doc(docId)
                
                if (value) {
                  batch.set(ref, {
                    type: category,
                    id: id,
                    value: prepareForFirebase(value)
                  }, { merge: true })
                } else {
                  batch.delete(ref)
                }
              }
            }
            
            await batch.commit()
          } catch (error) {
            console.error('[Firebase Auth] Error saving keys:', error.message)
            throw error
          }
        }
      }
    },
    saveCreds: async () => {
      try {
        const preparedCreds = prepareForFirebase({ ...creds })
        
        await credsCollection.doc('credentials').set({
          ...preparedCreds,
          _id: 'credentials',
          updatedAt: new Date().toISOString()
        }, { merge: true })
        
        console.log('[Firebase Auth] Credentials saved successfully')
      } catch (error) {
        console.error('[Firebase Auth] Error saving credentials:', error.message)
        throw error
      }
    }
  }
}

/**
 * Clears the authentication state from Firebase
 */
export const clearFirebaseAuthState = async () => {
  const db = await getFirebaseDb()
  if (!db) return

  try {
    const credsCollection = db.collection('auth_credentials')
    const keysCollection = db.collection('auth_keys')

    // Delete credentials
    await credsCollection.doc('credentials').delete()

    // Delete keys
    // listDocuments() is available in the admin SDK
    const keysDocs = await keysCollection.listDocuments()
    if (keysDocs.length > 0) {
      const batch = db.batch()
      keysDocs.forEach(doc => batch.delete(doc))
      await batch.commit()
    }

    console.log('[Firebase Auth] Authentication state cleared successfully')
  } catch (error) {
    console.error('[Firebase Auth] Error clearing auth state:', error.message)
  }
}

export default useFirebaseAuthState
