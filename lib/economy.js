/**
 * Economy System for NEXUS-MD
 * Handles virtual currency, work, daily rewards, and transactions
 */

// Currency settings
export const CURRENCY = {
  name: 'NexCoins',
  symbol: '💰',
  emoji: '🪙'
}

// Work cooldowns (in milliseconds)
export const COOLDOWNS = {
  daily: 24 * 60 * 60 * 1000,      // 24 hours
  work: 30 * 60 * 1000,            // 30 minutes
  crime: 60 * 60 * 1000,           // 1 hour
  rob: 2 * 60 * 60 * 1000,         // 2 hours
  mine: 15 * 60 * 1000,            // 15 minutes
  fish: 20 * 60 * 1000,            // 20 minutes
  hunt: 25 * 60 * 1000             // 25 minutes
}

// Work rewards
export const REWARDS = {
  daily: { min: 500, max: 1500 },
  work: { min: 100, max: 500 },
  crime: { min: 200, max: 1000 },
  mine: { min: 50, max: 300 },
  fish: { min: 30, max: 200 },
  hunt: { min: 80, max: 400 }
}

// Work messages - random responses for work command
export const WORK_MESSAGES = [
  { job: 'Software Developer', emoji: '💻', bonus: 1.2 },
  { job: 'Doctor', emoji: '👨‍⚕️', bonus: 1.3 },
  { job: 'Chef', emoji: '👨‍🍳', bonus: 1.0 },
  { job: 'Teacher', emoji: '👨‍🏫', bonus: 1.1 },
  { job: 'Farmer', emoji: '👨‍🌾', bonus: 0.9 },
  { job: 'Artist', emoji: '🎨', bonus: 1.0 },
  { job: 'Musician', emoji: '🎵', bonus: 1.1 },
  { job: 'Driver', emoji: '🚗', bonus: 0.8 },
  { job: 'Builder', emoji: '👷', bonus: 1.0 },
  { job: 'Scientist', emoji: '🔬', bonus: 1.4 },
  { job: 'Pilot', emoji: '✈️', bonus: 1.5 },
  { job: 'Streamer', emoji: '📹', bonus: 1.2 },
  { job: 'YouTuber', emoji: '▶️', bonus: 1.3 },
  { job: 'Photographer', emoji: '📸', bonus: 1.0 },
  { job: 'Security Guard', emoji: '💂', bonus: 0.9 }
]

// Crime messages
export const CRIME_MESSAGES = [
  { crime: 'Robbed a bank', emoji: '🏦', risk: 0.3 },
  { crime: 'Stole jewelry', emoji: '💎', risk: 0.4 },
  { crime: 'Hacked a company', emoji: '🖥️', risk: 0.35 },
  { crime: 'Pickpocketed tourists', emoji: '👛', risk: 0.2 },
  { crime: 'Sold fake watches', emoji: '⌚', risk: 0.25 },
  { crime: 'Smuggled goods', emoji: '📦', risk: 0.5 },
  { crime: 'Identity theft', emoji: '🪪', risk: 0.45 },
  { crime: 'Insurance fraud', emoji: '📄', risk: 0.4 }
]

// Mining resources
export const MINE_RESOURCES = [
  { name: 'Coal', emoji: '�ite⬛', value: 10, chance: 40 },
  { name: 'Iron', emoji: '🔩', value: 25, chance: 25 },
  { name: 'Gold', emoji: '🥇', value: 100, chance: 15 },
  { name: 'Diamond', emoji: '💎', value: 500, chance: 8 },
  { name: 'Emerald', emoji: '💚', value: 300, chance: 10 },
  { name: 'Ruby', emoji: '❤️', value: 350, chance: 2 }
]

// Fish types
export const FISH_TYPES = [
  { name: 'Sardine', emoji: '🐟', value: 10, chance: 30 },
  { name: 'Salmon', emoji: '🐠', value: 30, chance: 25 },
  { name: 'Tuna', emoji: '🐡', value: 50, chance: 20 },
  { name: 'Shark', emoji: '🦈', value: 200, chance: 10 },
  { name: 'Golden Fish', emoji: '✨🐟', value: 500, chance: 5 },
  { name: 'Old Boot', emoji: '👢', value: 1, chance: 10 }
]

// Hunt animals
export const HUNT_ANIMALS = [
  { name: 'Rabbit', emoji: '🐰', value: 20, chance: 30 },
  { name: 'Deer', emoji: '🦌', value: 80, chance: 25 },
  { name: 'Boar', emoji: '🐗', value: 100, chance: 20 },
  { name: 'Bear', emoji: '🐻', value: 300, chance: 10 },
  { name: 'Lion', emoji: '🦁', value: 500, chance: 8 },
  { name: 'Dragon', emoji: '🐉', value: 2000, chance: 2 },
  { name: 'Nothing', emoji: '💨', value: 0, chance: 5 }
]

/**
 * Initialize user economy data
 */
export function initUserEconomy(user) {
  if (!user.economy) {
    user.economy = {
      wallet: 0,
      bank: 0,
      exp: 0,
      level: 1,
      lastDaily: 0,
      lastWork: 0,
      lastCrime: 0,
      lastMine: 0,
      lastFish: 0,
      lastHunt: 0,
      totalEarned: 0,
      totalSpent: 0,
      workCount: 0,
      streak: 0,
      lastStreakDate: 0
    }
  }
  return user.economy
}

/**
 * Format currency with symbol
 */
export function formatMoney(amount) {
  return `${CURRENCY.symbol} ${amount.toLocaleString()}`
}

/**
 * Calculate user level from XP
 */
export function calculateLevel(exp) {
  return Math.floor(0.1 * Math.sqrt(exp)) + 1
}

/**
 * Calculate XP needed for next level
 */
export function xpForLevel(level) {
  return Math.pow((level) * 10, 2)
}

/**
 * Random number between min and max (inclusive)
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Pick random item from array based on chance weights
 */
export function pickWeighted(items) {
  const totalChance = items.reduce((sum, item) => sum + item.chance, 0)
  let random = Math.random() * totalChance
  
  for (const item of items) {
    random -= item.chance
    if (random <= 0) return item
  }
  return items[items.length - 1]
}

/**
 * Check if cooldown has passed
 */
export function canDo(lastTime, cooldown) {
  return Date.now() - lastTime >= cooldown
}

/**
 * Get remaining cooldown time
 */
export function getRemainingCooldown(lastTime, cooldown) {
  const remaining = cooldown - (Date.now() - lastTime)
  return remaining > 0 ? remaining : 0
}

/**
 * Format milliseconds to human readable time
 */
export function formatTime(ms) {
  const seconds = Math.floor((ms / 1000) % 60)
  const minutes = Math.floor((ms / (60 * 1000)) % 60)
  const hours = Math.floor((ms / (60 * 60 * 1000)) % 24)
  const days = Math.floor(ms / (24 * 60 * 60 * 1000))
  
  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (seconds > 0) parts.push(`${seconds}s`)
  
  return parts.join(' ') || '0s'
}

/**
 * Add money to user wallet
 */
export function addMoney(user, amount) {
  const economy = initUserEconomy(user)
  economy.wallet += amount
  economy.totalEarned += amount
  return economy.wallet
}

/**
 * Remove money from user wallet
 */
export function removeMoney(user, amount) {
  const economy = initUserEconomy(user)
  if (economy.wallet < amount) return false
  economy.wallet -= amount
  economy.totalSpent += amount
  return economy.wallet
}

/**
 * Transfer money between wallet and bank
 */
export function deposit(user, amount) {
  const economy = initUserEconomy(user)
  if (economy.wallet < amount) return false
  economy.wallet -= amount
  economy.bank += amount
  return true
}

export function withdraw(user, amount) {
  const economy = initUserEconomy(user)
  if (economy.bank < amount) return false
  economy.bank -= amount
  economy.wallet += amount
  return true
}

/**
 * Add experience points
 */
export function addExp(user, amount) {
  const economy = initUserEconomy(user)
  economy.exp += amount
  const newLevel = calculateLevel(economy.exp)
  const leveledUp = newLevel > economy.level
  economy.level = newLevel
  return { exp: economy.exp, level: economy.level, leveledUp }
}

/**
 * Get leaderboard data
 */
export function getLeaderboard(users, type = 'total', limit = 10) {
  const entries = Object.entries(users)
    .filter(([, user]) => user.economy)
    .map(([jid, user]) => ({
      jid,
      name: user.name || jid.split('@')[0],
      wallet: user.economy?.wallet || 0,
      bank: user.economy?.bank || 0,
      total: (user.economy?.wallet || 0) + (user.economy?.bank || 0),
      level: user.economy?.level || 1,
      exp: user.economy?.exp || 0
    }))
    .sort((a, b) => b[type] - a[type])
    .slice(0, limit)
  
  return entries
}

/**
 * Check daily streak
 */
export function checkStreak(user) {
  const economy = initUserEconomy(user)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const lastDate = economy.lastStreakDate
  
  if (lastDate === 0) {
    economy.streak = 1
  } else {
    const yesterday = today - 24 * 60 * 60 * 1000
    if (lastDate >= yesterday && lastDate < today) {
      economy.streak += 1
    } else if (lastDate < yesterday) {
      economy.streak = 1
    }
  }
  
  economy.lastStreakDate = today
  return economy.streak
}

/**
 * Calculate streak bonus multiplier
 */
export function getStreakBonus(streak) {
  // 5% bonus per day, max 100% (20 day streak)
  return Math.min(1 + (streak * 0.05), 2)
}

export default {
  CURRENCY,
  COOLDOWNS,
  REWARDS,
  WORK_MESSAGES,
  CRIME_MESSAGES,
  MINE_RESOURCES,
  FISH_TYPES,
  HUNT_ANIMALS,
  initUserEconomy,
  formatMoney,
  calculateLevel,
  xpForLevel,
  randomInt,
  pickWeighted,
  canDo,
  getRemainingCooldown,
  formatTime,
  addMoney,
  removeMoney,
  deposit,
  withdraw,
  addExp,
  getLeaderboard,
  checkStreak,
  getStreakBonus
}
