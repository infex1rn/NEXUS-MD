/**
 * Card Command: Cards / Collection
 * View your anime card collection
 */
import { initUserCards, getUserCards, getCollectionStats, RARITIES, CARDS, CATEGORIES } from '../../lib/cards.js'

let handler = async (m, { conn, args, usedPrefix }) => {
  const user = global.db.data.users[m.sender]
  const cards = initUserCards(user)
  const stats = getCollectionStats(user)
  const userCards = getUserCards(user)
  
  // Filter/sort options
  const filter = args[0]?.toLowerCase()
  
  let filteredCards = userCards
  let filterText = 'All Cards'
  
  if (filter && RARITIES[filter]) {
    filteredCards = userCards.filter(c => c.rarity?.name?.toLowerCase() === filter)
    filterText = `${RARITIES[filter].emoji} ${RARITIES[filter].name} Cards`
  }
  
  // Paginate (10 per page)
  const page = parseInt(args[1]) || 1
  const perPage = 10
  const totalPages = Math.ceil(filteredCards.length / perPage)
  const startIndex = (page - 1) * perPage
  const pageCards = filteredCards.slice(startIndex, startIndex + perPage)
  
  let replyText = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🎴 *ANIME CARD COLLECTION*
┃  👤 ${user.name || m.sender.split('@')[0]}
╰━━━━━━━━━━━━━━━━━━━━━╯

📊 *Collection Stats*
├ Total Cards: ${stats.total}
├ Unique: ${stats.unique}/${stats.totalCards}
├ Completion: ${stats.completion}%
├ Value: 💰 ${stats.value.toLocaleString()}
└ Total Pulls: ${stats.pulls}

📈 *By Rarity*
`

  for (const [rarity, data] of Object.entries(RARITIES)) {
    const count = stats.byRarity[rarity] || 0
    const animatedTag = data.animated ? '🎬' : '🖼️'
    const specialTag = data.special ? '👑' : ''
    replyText += `├ ${data.emoji} ${data.name}: ${count} ${animatedTag}${specialTag}\n`
  }

  replyText += `
━━━━━━━━━━━━━━━━━━━━━
📋 *${filterText}* (Page ${page}/${totalPages || 1})
`

  if (pageCards.length === 0) {
    replyText += `\n_No anime cards found!_\n`
  } else {
    for (const card of pageCards) {
      const rarity = card.rarity || RARITIES[card.rarity]
      const animatedTag = rarity?.animated ? '🎬' : ''
      const specialTag = rarity?.special ? '👑' : ''
      const categoryEmoji = CATEGORIES[card.category] || '❓'
      replyText += `\n${rarity?.emoji || '🎴'} ${specialTag}*${card.name}* ${animatedTag}\n`
      replyText += `├ 📺 ${card.anime || 'Unknown'}\n`
      replyText += `└ \`${card.serial}\` | ${categoryEmoji} | ⚔️ ${card.power}\n`
    }
  }

  replyText += `
━━━━━━━━━━━━━━━━━━━━━
*Card Types:*
├ 🖼️ Static - Common, Uncommon, Rare
├ 🎬 Animated - Epic, Legendary
└ 👑 Special - Mythic (Highest!)

*Commands:*
├ ${usedPrefix}cards <rarity> - Filter by rarity
├ ${usedPrefix}cards all <page> - View page
├ ${usedPrefix}cardinfo <serial> - Card details + image
├ ${usedPrefix}sendcard @user <serial> - Gift card
└ ${usedPrefix}fav <serial> - Favorite a card

_Rarities: common, uncommon, rare, epic, legendary, mythic_
`.trim()

  await m.reply(replyText)
}

handler.help = ['cards', 'cards <rarity>', 'collection']
handler.tags = ['cards']
handler.command = ['cards', 'mycards', 'collection', 'cardlist', 'inventory']
handler.desc = 'View your anime card collection'

export default handler
