/**
 * Firebase Auth State for Baileys
 * Stores WhatsApp session credentials in Firebase Firestore
 * Based on the MongoDB auth pattern from GURU-Ai
 */

import { initAuthCreds, proto, BufferJSON } from '@whiskeysockets/baileys'
import { initFirebase, prepareForFirebase, restoreFromFirebase } from '../firebase.js'

let firebaseDb = null
const queue = []
let isProcessing = false

async function processQueue() {
  if (isProcessing || queue.length === 0) return
  isProcessing = true
  while (queue.length > 0) {
    const task = queue.shift()
    try {
      await task()
    } catch (error) {
      console.error('[Firebase Auth] Queue processing error:', error)
    }
  }
  isProcessing = false
}

function addToQueue(task) {
  queue.push(task)
  processQueue().catch(console.error)
}

/**
 * Wait for all pending tasks in the queue to complete
 */
export async function flushAuthQueue() {
  while (queue.length > 0 || isProcessing) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

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
      const docData = credsDoc.data()
      if (docData.data && typeof docData.data === 'string') {
        // New stringified JSON format
        creds = JSON.parse(docData.data, BufferJSON.reviver)
      } else {
        // Legacy format
        delete docData._id
        creds = restoreFromFirebase(docData)
      }
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
            if (!ids || ids.length === 0) return {}

            const data = {}
            const refs = ids.map(id => keysCollection.doc(`${type}_${id}`.replace(/[\/\.]/g, '_')))
            
            // Use db.getAll to fetch multiple documents in a single request
            // Chunking into 100 to be safe, though Firestore supports more
            for (let i = 0; i < refs.length; i += 100) {
              const chunkRefs = refs.slice(i, i + 100)
              const chunkIds = ids.slice(i, i + 100)
              const docs = await db.getAll(...chunkRefs)
              
              docs.forEach((doc, index) => {
                if (doc.exists) {
                  const id = chunkIds[index]
                  const docData = doc.data()
                  let value

                  if (docData.data && typeof docData.data === 'string') {
                    // New stringified JSON format
                    value = JSON.parse(docData.data, BufferJSON.reviver)
                  } else {
                    // Legacy format
                    value = restoreFromFirebase(docData.value)
                    // Special handling for app-state-sync-key
                    if (type === 'app-state-sync-key' && value) {
                      value = proto.Message.AppStateSyncKeyData.fromObject(value)
                    }
                  }

                  data[id] = value
                }
              })
            }
            
            return data
          } catch (error) {
            console.error('[Firebase Auth] Error retrieving keys:', error.message)
            return {}
          }
        },
        set: async (data) => {
          addToQueue(async () => {
            try {
              const flattenedKeys = []
              for (const category in data) {
                for (const id in data[category]) {
                  flattenedKeys.push({ category, id, value: data[category][id] })
                }
              }

              // Firestore batch limit is 500 operations
              for (let i = 0; i < flattenedKeys.length; i += 500) {
                const batch = db.batch()
                const chunk = flattenedKeys.slice(i, i + 500)

                for (const { category, id, value } of chunk) {
                  const docId = `${category}_${id}`.replace(/[\/\.]/g, '_')
                  const ref = keysCollection.doc(docId)

                  if (value) {
                    batch.set(ref, {
                      type: category,
                      id: id,
                      data: JSON.stringify(value, BufferJSON.replacer)
                    }, { merge: true })
                  } else {
                    batch.delete(ref)
                  }
                }
                await batch.commit()
              }
            } catch (error) {
              console.error('[Firebase Auth] Error saving keys:', error.message)
            }
          })
        }
      }
    },
    saveCreds: async () => {
      addToQueue(async () => {
        try {
          await credsCollection.doc('credentials').set({
            data: JSON.stringify(creds, BufferJSON.replacer),
            _id: 'credentials',
            updatedAt: new Date().toISOString()
          }, { merge: true })

          console.log('[Firebase Auth] Credentials saved successfully')
        } catch (error) {
          console.error('[Firebase Auth] Error saving credentials:', error.message)
        }
      })
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
