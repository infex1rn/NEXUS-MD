/**
 * Card Drop System for NEXUS-MD
 * Handles automatic card drops and claiming
 */
import { CARDS, RARITIES, initUserCards } from './cards.js'

// Store for active drops (in-memory, persists via database)
export const activeDrops = new Map()

// Drop settings
export const DROP_SETTINGS = {
  interval: 60 * 60 * 1000,  // 1 hour in milliseconds
  cardsPerDrop: 3,           // Cards dropped per drop event
  claimTimeout: 30 * 60 * 1000, // 30 minutes to claim before expiry
  minGroupSize: 3            // Minimum group members for drops
}

/**
 * Generate a unique serial number for dropped cards
 */
export function generateSerial() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let serial = 'NX-'
  for (let i = 0; i < 6; i++) {
    serial += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return serial
}

/**
 * Roll for card rarity (slightly better rates for drops)
 */
function rollDropRarity() {
  const dropRates = {
    common: 40,
    uncommon: 30,
    rare: 18,
    epic: 8,
    legendary: 3.5,
    mythic: 0.5
  }
  
  const total = Object.values(dropRates).reduce((a, b) => a + b, 0)
  let random = Math.random() * total
  
  for (const [rarity, chance] of Object.entries(dropRates)) {
    random -= chance
    if (random <= 0) return rarity
  }
  return 'common'
}

/**
 * Generate cards for a drop
 */
export function generateDropCards(count = DROP_SETTINGS.cardsPerDrop) {
  const droppedCards = []
  
  for (let i = 0; i < count; i++) {
    const rarity = rollDropRarity()
    const availableCards = CARDS.filter(c => c.rarity === rarity)
    const card = availableCards[Math.floor(Math.random() * availableCards.length)]
    
    droppedCards.push({
      ...card,
      serial: generateSerial(),
      droppedAt: Date.now(),
      claimed: false,
      claimedBy: null
    })
  }
  
  return droppedCards
}

/**
 * Create a drop in a chat
 */
export function createDrop(chatId) {
  const cards = generateDropCards()
  
  const drop = {
    chatId,
    cards,
    createdAt: Date.now(),
    expiresAt: Date.now() + DROP_SETTINGS.claimTimeout
  }
  
  activeDrops.set(chatId, drop)
  
  // Store in database for persistence
  if (!global.db.data.drops) global.db.data.drops = {}
  global.db.data.drops[chatId] = drop
  
  return drop
}

/**
 * Get active drop for a chat
 */
export function getActiveDrop(chatId) {
  // Check memory first
  let drop = activeDrops.get(chatId)
  
  // Check database
  if (!drop && global.db.data.drops?.[chatId]) {
    drop = global.db.data.drops[chatId]
    activeDrops.set(chatId, drop)
  }
  
  // Check if expired
  if (drop && Date.now() > drop.expiresAt) {
    activeDrops.delete(chatId)
    delete global.db.data.drops?.[chatId]
    return null
  }
  
  return drop
}

/**
 * Claim a card from a drop
 */
export function claimCard(chatId, serial, userId) {
  const drop = getActiveDrop(chatId)
  if (!drop) return { success: false, error: 'No active drop in this chat!' }
  
  const cardIndex = drop.cards.findIndex(c => 
    c.serial.toLowerCase() === serial.toLowerCase() && !c.claimed
  )
  
  if (cardIndex === -1) {
    // Check if already claimed
    const claimed = drop.cards.find(c => c.serial.toLowerCase() === serial.toLowerCase())
    if (claimed?.claimed) {
      return { success: false, error: `This card was already claimed by @${claimed.claimedBy.split('@')[0]}!` }
    }
    return { success: false, error: 'Card not found! Check the serial number.' }
  }
  
  const card = drop.cards[cardIndex]
  
  // Mark as claimed
  card.claimed = true
  card.claimedBy = userId
  card.claimedAt = Date.now()
  
  // Add to user's collection
  const user = global.db.data.users[userId]
  if (!user) return { success: false, error: 'User not found!' }
  
  const userCards = initUserCards(user)
  userCards.collection.push({
    cardId: card.id,
    serial: card.serial,
    obtainedAt: Date.now(),
    obtainedFrom: 'drop',
    chatId
  })
  
  // Update database
  if (global.db.data.drops) {
    global.db.data.drops[chatId] = drop
  }
  
  // Check if all cards claimed
  const allClaimed = drop.cards.every(c => c.claimed)
  if (allClaimed) {
    activeDrops.delete(chatId)
    delete global.db.data.drops?.[chatId]
  }
  
  return { 
    success: true, 
    card,
    rarity: RARITIES[card.rarity],
    allClaimed
  }
}

/**
 * Format drop message
 */
export function formatDropMessage(drop) {
  let text = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🎴 *ANIME CARD DROP!*
┃  _Characters have appeared!_
╰━━━━━━━━━━━━━━━━━━━━━╯

*Claim cards with:* \`.claim <SERIAL>\`

`

  for (const card of drop.cards) {
    const rarity = RARITIES[card.rarity]
    const status = card.claimed ? `✅ Claimed by @${card.claimedBy?.split('@')[0]}` : '🔓 Available'
    const animatedBadge = rarity.animated ? '🎬 Animated' : '🖼️ Static'
    const specialBadge = rarity.special ? '👑 ' : ''
    
    text += `${rarity.emoji} ${specialBadge}*${card.name}*\n`
    text += `├ Anime: 📺 ${card.anime || 'Unknown'}\n`
    text += `├ Serial: \`${card.serial}\`\n`
    text += `├ Rarity: ${rarity.name} ${animatedBadge}\n`
    text += `├ Power: ⚔️ ${card.power}\n`
    text += `└ ${status}\n\n`
  }
  
  const remaining = Math.floor((drop.expiresAt - Date.now()) / 60000)
  text += `⏰ _Expires in ${remaining} minutes_`
  
  return text
}

/**
 * Get time until next drop
 */
export function getNextDropTime(chatId) {
  const lastDrop = global.db.data.lastDrops?.[chatId] || 0
  const nextDrop = lastDrop + DROP_SETTINGS.interval
  return Math.max(0, nextDrop - Date.now())
}

/**
 * Check if chat is eligible for drop
 */
export function canDrop(chatId) {
  const lastDrop = global.db.data.lastDrops?.[chatId] || 0
  return Date.now() - lastDrop >= DROP_SETTINGS.interval
}

/**
 * Record drop time
 */
export function recordDrop(chatId) {
  if (!global.db.data.lastDrops) global.db.data.lastDrops = {}
  global.db.data.lastDrops[chatId] = Date.now()
}

export default {
  activeDrops,
  DROP_SETTINGS,
  generateSerial,
  generateDropCards,
  createDrop,
  getActiveDrop,
  claimCard,
  formatDropMessage,
  getNextDropTime,
  canDrop,
  recordDrop
}
