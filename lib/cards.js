/**
 * Card Collection System for NEXUS-MD
 * Anime character gacha/collection system with card tiers, trading, and marketplace
 */

// Card rarities with their colors and drop rates
export const RARITIES = {
  common: { name: 'Common', emoji: '⚪', color: '#9E9E9E', chance: 50, value: 50, animated: false },
  uncommon: { name: 'Uncommon', emoji: '🟢', color: '#4CAF50', chance: 25, value: 150, animated: false },
  rare: { name: 'Rare', emoji: '🔵', color: '#2196F3', chance: 15, value: 500, animated: false },
  epic: { name: 'Epic', emoji: '🟣', color: '#9C27B0', chance: 7, value: 1500, animated: true },
  legendary: { name: 'Legendary', emoji: '🟡', color: '#FF9800', chance: 2.5, value: 5000, animated: true },
  mythic: { name: 'Mythic', emoji: '🔴', color: '#F44336', chance: 0.5, value: 20000, animated: true, special: true }
}

// Card categories (anime genres)
export const CATEGORIES = {
  shonen: '⚔️',
  shojo: '💕',
  seinen: '🗡️',
  isekai: '🌀',
  mecha: '🤖',
  fantasy: '✨',
  sports: '⚽',
  slice_of_life: '🌸'
}

// Anime character card database - expandable collection
export const CARDS = [
  // ===== COMMON CARDS (Static Images) =====
  // Shonen
  { id: 'c001', name: 'Izuku Midoriya', anime: 'My Hero Academia', category: 'shonen', rarity: 'common', power: 15, description: 'A quirkless boy who dreams of becoming a hero', image: 'https://i.imgur.com/deku_common.jpg' },
  { id: 'c002', name: 'Tanjiro Kamado', anime: 'Demon Slayer', category: 'shonen', rarity: 'common', power: 14, description: 'A kind-hearted demon slayer with a strong sense of smell', image: 'https://i.imgur.com/tanjiro_common.jpg' },
  { id: 'c003', name: 'Asta', anime: 'Black Clover', category: 'shonen', rarity: 'common', power: 13, description: 'A boy born without magic in a world of mages', image: 'https://i.imgur.com/asta_common.jpg' },
  { id: 'c004', name: 'Senku Ishigami', anime: 'Dr. Stone', category: 'shonen', rarity: 'common', power: 12, description: 'A genius scientist rebuilding civilization', image: 'https://i.imgur.com/senku_common.jpg' },
  { id: 'c005', name: 'Yuji Itadori', anime: 'Jujutsu Kaisen', category: 'shonen', rarity: 'common', power: 14, description: 'A high schooler who swallowed a cursed finger', image: 'https://i.imgur.com/yuji_common.jpg' },
  
  // Shojo
  { id: 'c006', name: 'Tohru Honda', anime: 'Fruits Basket', category: 'shojo', rarity: 'common', power: 8, description: 'A kind orphan living with the Soma family', image: 'https://i.imgur.com/tohru_common.jpg' },
  { id: 'c007', name: 'Usagi Tsukino', anime: 'Sailor Moon', category: 'shojo', rarity: 'common', power: 10, description: 'A clumsy schoolgirl who becomes Sailor Moon', image: 'https://i.imgur.com/usagi_common.jpg' },
  { id: 'c008', name: 'Sakura Kinomoto', anime: 'Cardcaptor Sakura', category: 'shojo', rarity: 'common', power: 11, description: 'A magical girl capturing Clow Cards', image: 'https://i.imgur.com/sakura_common.jpg' },
  
  // Slice of Life
  { id: 'c009', name: 'Kobayashi', anime: 'Miss Kobayashi Dragon Maid', category: 'slice_of_life', rarity: 'common', power: 5, description: 'An office worker with a dragon maid', image: 'https://i.imgur.com/kobayashi_common.jpg' },
  { id: 'c010', name: 'Takumi Aldini', anime: 'Food Wars', category: 'slice_of_life', rarity: 'common', power: 12, description: 'An Italian-Japanese chef', image: 'https://i.imgur.com/takumi_common.jpg' },

  // ===== UNCOMMON CARDS (Static Images) =====
  { id: 'u001', name: 'Nezuko Kamado', anime: 'Demon Slayer', category: 'shonen', rarity: 'uncommon', power: 25, description: 'A demon who protects humans', image: 'https://i.imgur.com/nezuko_uncommon.jpg' },
  { id: 'u002', name: 'Ochaco Uraraka', anime: 'My Hero Academia', category: 'shonen', rarity: 'uncommon', power: 22, description: 'Zero Gravity hero in training', image: 'https://i.imgur.com/ochaco_uncommon.jpg' },
  { id: 'u003', name: 'Zenitsu Agatsuma', anime: 'Demon Slayer', category: 'shonen', rarity: 'uncommon', power: 28, description: 'Thunder Breathing swordsman', image: 'https://i.imgur.com/zenitsu_uncommon.jpg' },
  { id: 'u004', name: 'Megumi Fushiguro', anime: 'Jujutsu Kaisen', category: 'shonen', rarity: 'uncommon', power: 30, description: 'Shadow technique user', image: 'https://i.imgur.com/megumi_uncommon.jpg' },
  { id: 'u005', name: 'Rem', anime: 'Re:Zero', category: 'isekai', rarity: 'uncommon', power: 26, description: 'A devoted demon maid', image: 'https://i.imgur.com/rem_uncommon.jpg' },
  { id: 'u006', name: 'Emilia', anime: 'Re:Zero', category: 'isekai', rarity: 'uncommon', power: 24, description: 'A half-elf royal candidate', image: 'https://i.imgur.com/emilia_uncommon.jpg' },
  { id: 'u007', name: 'Megumin', anime: 'Konosuba', category: 'isekai', rarity: 'uncommon', power: 35, description: 'Explosion magic specialist', image: 'https://i.imgur.com/megumin_uncommon.jpg' },
  { id: 'u008', name: 'Shoyo Hinata', anime: 'Haikyuu', category: 'sports', rarity: 'uncommon', power: 20, description: 'The Little Giant of volleyball', image: 'https://i.imgur.com/hinata_uncommon.jpg' },

  // ===== RARE CARDS (Static Images) =====
  { id: 'r001', name: 'Shoto Todoroki', anime: 'My Hero Academia', category: 'shonen', rarity: 'rare', power: 55, description: 'Half-Cold Half-Hot hero', image: 'https://i.imgur.com/todoroki_rare.jpg' },
  { id: 'r002', name: 'Nobara Kugisaki', anime: 'Jujutsu Kaisen', category: 'shonen', rarity: 'rare', power: 50, description: 'Straw Doll technique user', image: 'https://i.imgur.com/nobara_rare.jpg' },
  { id: 'r003', name: 'Inosuke Hashibira', anime: 'Demon Slayer', category: 'shonen', rarity: 'rare', power: 52, description: 'Beast Breathing swordsman', image: 'https://i.imgur.com/inosuke_rare.jpg' },
  { id: 'r004', name: 'Mikasa Ackerman', anime: 'Attack on Titan', category: 'seinen', rarity: 'rare', power: 60, description: 'Humanity\'s strongest soldier', image: 'https://i.imgur.com/mikasa_rare.jpg' },
  { id: 'r005', name: 'Zero Two', anime: 'Darling in the Franxx', category: 'mecha', rarity: 'rare', power: 58, description: 'Legendary FranXX pilot', image: 'https://i.imgur.com/zerotwo_rare.jpg' },
  { id: 'r006', name: 'Aqua', anime: 'Konosuba', category: 'isekai', rarity: 'rare', power: 45, description: 'Useless goddess of water', image: 'https://i.imgur.com/aqua_rare.jpg' },

  // ===== EPIC CARDS (Animated GIFs) =====
  { id: 'e001', name: 'Gojo Satoru', anime: 'Jujutsu Kaisen', category: 'shonen', rarity: 'epic', power: 100, description: 'The strongest jujutsu sorcerer', image: 'https://i.imgur.com/gojo_epic.gif' },
  { id: 'e002', name: 'Levi Ackerman', anime: 'Attack on Titan', category: 'seinen', rarity: 'epic', power: 95, description: 'Captain of the Survey Corps', image: 'https://i.imgur.com/levi_epic.gif' },
  { id: 'e003', name: 'Erza Scarlet', anime: 'Fairy Tail', category: 'shonen', rarity: 'epic', power: 90, description: 'Titania, Queen of Fairies', image: 'https://i.imgur.com/erza_epic.gif' },
  { id: 'e004', name: 'Kakashi Hatake', anime: 'Naruto', category: 'shonen', rarity: 'epic', power: 92, description: 'The Copy Ninja', image: 'https://i.imgur.com/kakashi_epic.gif' },
  { id: 'e005', name: 'Rimuru Tempest', anime: 'That Time I Got Reincarnated as a Slime', category: 'isekai', rarity: 'epic', power: 98, description: 'The strongest slime', image: 'https://i.imgur.com/rimuru_epic.gif' },

  // ===== LEGENDARY CARDS (Animated GIFs) =====
  { id: 'l001', name: 'Goku Ultra Instinct', anime: 'Dragon Ball Super', category: 'shonen', rarity: 'legendary', power: 200, description: 'Mastered Ultra Instinct form', image: 'https://i.imgur.com/goku_ui_legendary.gif' },
  { id: 'l002', name: 'Naruto Uzumaki (Baryon)', anime: 'Boruto', category: 'shonen', rarity: 'legendary', power: 195, description: 'Baryon Mode activated', image: 'https://i.imgur.com/naruto_baryon_legendary.gif' },
  { id: 'l003', name: 'Sukuna', anime: 'Jujutsu Kaisen', category: 'shonen', rarity: 'legendary', power: 220, description: 'King of Curses', image: 'https://i.imgur.com/sukuna_legendary.gif' },
  { id: 'l004', name: 'Madara Uchiha', anime: 'Naruto Shippuden', category: 'shonen', rarity: 'legendary', power: 210, description: 'The legendary Uchiha', image: 'https://i.imgur.com/madara_legendary.gif' },

  // ===== MYTHIC CARDS (Special Animated GIFs - Highest Tier) =====
  { id: 'm001', name: 'Saitama', anime: 'One Punch Man', category: 'seinen', rarity: 'mythic', power: 999, description: 'One Punch is all he needs', image: 'https://i.imgur.com/saitama_mythic.gif' },
  { id: 'm002', name: 'Zeno', anime: 'Dragon Ball Super', category: 'shonen', rarity: 'mythic', power: 9999, description: 'The Omni-King who erases universes', image: 'https://i.imgur.com/zeno_mythic.gif' },
  { id: 'm003', name: 'Anos Voldigoad', anime: 'The Misfit of Demon King Academy', category: 'isekai', rarity: 'mythic', power: 5000, description: 'The Demon King of Tyranny', image: 'https://i.imgur.com/anos_mythic.gif' }
]

// Anime character image API endpoints (for fetching real images)
export const ANIME_IMAGE_APIS = {
  // These can be replaced with actual API endpoints
  waifu: 'https://api.waifu.pics/sfw/waifu',
  neko: 'https://api.waifu.pics/sfw/neko',
  // Placeholder for card images - in production, use actual hosted images
  placeholder: 'https://via.placeholder.com/400x600'
}

// Gacha costs
export const GACHA_COSTS = {
  single: 100,
  multi10: 900,     // 10% discount
  multi50: 4000     // 20% discount
}

/**
 * Initialize user card collection
 */
export function initUserCards(user) {
  if (!user.cards) {
    user.cards = {
      collection: [],     // Array of card IDs user owns
      favorites: [],      // Favorited cards
      tradeLocked: [],    // Cards that can't be traded
      totalPulls: 0,
      pity: 0,            // Pity counter for guaranteed rare+
      lastPull: 0
    }
  }
  return user.cards
}

/**
 * Pull a random card based on rarity chances
 */
export function pullCard(user, increasePity = true) {
  const cards = initUserCards(user)
  
  // Pity system - guaranteed epic+ after 50 pulls, legendary+ after 100
  let guaranteedRarity = null
  if (cards.pity >= 100) {
    guaranteedRarity = 'legendary'
  } else if (cards.pity >= 50) {
    guaranteedRarity = 'epic'
  }
  
  // Roll for rarity
  let rarity = rollRarity(guaranteedRarity)
  
  // Get cards of that rarity
  const availableCards = CARDS.filter(c => c.rarity === rarity)
  const card = availableCards[Math.floor(Math.random() * availableCards.length)]
  
  // Update user stats
  cards.totalPulls++
  cards.lastPull = Date.now()
  
  // Reset or increase pity
  if (['epic', 'legendary', 'mythic'].includes(rarity)) {
    cards.pity = 0
  } else if (increasePity) {
    cards.pity++
  }
  
  // Add card to collection
  cards.collection.push({
    cardId: card.id,
    obtainedAt: Date.now(),
    serial: cards.totalPulls
  })
  
  return {
    card,
    rarity: RARITIES[rarity],
    isNew: cards.collection.filter(c => c.cardId === card.id).length === 1,
    pity: cards.pity
  }
}

/**
 * Roll for rarity
 */
function rollRarity(guaranteed = null) {
  if (guaranteed) {
    const eligibleRarities = Object.entries(RARITIES)
      .filter(([key]) => {
        const order = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']
        return order.indexOf(key) >= order.indexOf(guaranteed)
      })
    
    const totalChance = eligibleRarities.reduce((sum, [, r]) => sum + r.chance, 0)
    let random = Math.random() * totalChance
    
    for (const [key, r] of eligibleRarities) {
      random -= r.chance
      if (random <= 0) return key
    }
    return guaranteed
  }
  
  const totalChance = Object.values(RARITIES).reduce((sum, r) => sum + r.chance, 0)
  let random = Math.random() * totalChance
  
  for (const [key, r] of Object.entries(RARITIES)) {
    random -= r.chance
    if (random <= 0) return key
  }
  return 'common'
}

/**
 * Multi-pull cards
 */
export function multiPull(user, count) {
  const results = []
  for (let i = 0; i < count; i++) {
    results.push(pullCard(user, i < count - 1)) // Don't increase pity on last pull
  }
  return results
}

/**
 * Get card by ID
 */
export function getCardById(cardId) {
  return CARDS.find(c => c.id === cardId)
}

/**
 * Get user's card collection with details
 */
export function getUserCards(user) {
  const cards = initUserCards(user)
  return cards.collection.map(owned => ({
    ...owned,
    ...getCardById(owned.cardId),
    rarity: RARITIES[getCardById(owned.cardId)?.rarity]
  }))
}

/**
 * Count cards by rarity
 */
export function countByRarity(user) {
  const cards = getUserCards(user)
  const counts = {}
  
  for (const rarity of Object.keys(RARITIES)) {
    counts[rarity] = cards.filter(c => c.rarity?.name?.toLowerCase() === rarity).length
  }
  
  return counts
}

/**
 * Calculate collection value
 */
export function getCollectionValue(user) {
  const cards = getUserCards(user)
  return cards.reduce((sum, card) => sum + (card.rarity?.value || 0), 0)
}

/**
 * Trade cards between users
 */
export function tradeCards(fromUser, toUser, cardSerials) {
  const fromCards = initUserCards(fromUser)
  const toCards = initUserCards(toUser)
  
  const tradedCards = []
  
  for (const serial of cardSerials) {
    const cardIndex = fromCards.collection.findIndex(c => c.serial === serial)
    if (cardIndex === -1) continue
    
    // Check if card is trade-locked
    if (fromCards.tradeLocked.includes(serial)) continue
    
    const card = fromCards.collection.splice(cardIndex, 1)[0]
    card.tradedAt = Date.now()
    card.previousOwner = true
    toCards.collection.push(card)
    tradedCards.push(card)
  }
  
  return tradedCards
}

/**
 * Get card collection stats
 */
export function getCollectionStats(user) {
  const cards = initUserCards(user)
  const owned = getUserCards(user)
  const uniqueCards = [...new Set(owned.map(c => c.cardId))]
  
  return {
    total: owned.length,
    unique: uniqueCards.length,
    completion: Math.round((uniqueCards.length / CARDS.length) * 100),
    totalCards: CARDS.length,
    value: getCollectionValue(user),
    byRarity: countByRarity(user),
    pulls: cards.totalPulls,
    pity: cards.pity
  }
}

/**
 * Format card display
 */
export function formatCard(card, showSerial = false) {
  const rarity = RARITIES[card.rarity] || card.rarity
  const categoryEmoji = CATEGORIES[card.category] || '❓'
  const animatedBadge = rarity.animated ? '🎬' : '🖼️'
  const specialBadge = rarity.special ? '👑 MYTHIC ' : ''
  
  let text = `${rarity.emoji} ${specialBadge}*${card.name}*\n`
  text += `├ Anime: 📺 ${card.anime || 'Unknown'}\n`
  text += `├ Rarity: ${rarity.name} ${animatedBadge}\n`
  text += `├ Category: ${categoryEmoji} ${card.category}\n`
  text += `├ Power: ⚔️ ${card.power}\n`
  text += `├ Value: 💰 ${rarity.value}\n`
  if (showSerial && card.serial) text += `├ Serial: #${card.serial}\n`
  text += `└ ${card.description}`
  return text
}

/**
 * Check if card has animated image (Epic, Legendary, Mythic)
 */
export function isAnimatedCard(card) {
  const rarity = RARITIES[card.rarity]
  return rarity?.animated || false
}

/**
 * Get card image URL
 */
export function getCardImage(card) {
  return card.image || ANIME_IMAGE_APIS.placeholder
}

export default {
  RARITIES,
  CATEGORIES,
  CARDS,
  GACHA_COSTS,
  ANIME_IMAGE_APIS,
  initUserCards,
  pullCard,
  multiPull,
  getCardById,
  getUserCards,
  countByRarity,
  getCollectionValue,
  tradeCards,
  getCollectionStats,
  formatCard,
  isAnimatedCard,
  getCardImage
}
