/**
 * Card Command: Card Info
 * View detailed info about a specific card with image
 */
import { initUserCards, getCardById, RARITIES, CATEGORIES, isAnimatedCard, getCardImage } from '../../lib/cards.js'

let handler = async (m, { conn, args, usedPrefix }) => {
  const serial = args[0]?.toUpperCase()
  
  if (!serial) {
    return m.reply(`*Usage:* ${usedPrefix}cardinfo <serial>\n\nExample: ${usedPrefix}cardinfo NX-ABC123`)
  }
  
  const user = global.db.data.users[m.sender]
  const userCards = initUserCards(user)
  
  // Find in user's collection
  const ownedCard = userCards.collection.find(c => 
    c.serial?.toUpperCase() === serial.toUpperCase()
  )
  
  if (!ownedCard) {
    return m.reply(`❌ Card not found in your collection!\n\nUse *${usedPrefix}cards* to see your cards.`)
  }
  
  // Get card data
  const cardData = getCardById(ownedCard.cardId)
  
  if (!cardData) {
    return m.reply(`❌ Card data not found!`)
  }
  
  const rarity = RARITIES[cardData.rarity]
  const categoryEmoji = CATEGORIES[cardData.category] || '❓'
  const isFavorite = userCards.favorites?.includes(serial)
  const isAnimated = isAnimatedCard(cardData)
  const animatedBadge = isAnimated ? '🎬 Animated' : '🖼️ Static'
  const specialBadge = rarity.special ? '👑 MYTHIC TIER' : ''
  
  const obtainedDate = new Date(ownedCard.obtainedAt).toLocaleDateString()
  const obtainedMethod = ownedCard.obtainedFrom === 'drop' ? '🎁 Drop' : 
                         ownedCard.obtainedFrom === 'gacha' ? '🎰 Gacha' :
                         ownedCard.previousOwner ? '🔄 Trade' : '❓ Unknown'
  
  let replyText = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  ${rarity.emoji} *ANIME CARD INFO*
╰━━━━━━━━━━━━━━━━━━━━━╯

*${cardData.name}* ${specialBadge}
📺 _${cardData.anime || 'Unknown Anime'}_
${cardData.description}

━━━━━━━━━━━━━━━━━━━━━
📋 *Details*
├ Serial: \`${serial}\`
├ ID: ${cardData.id}
├ Rarity: ${rarity.emoji} ${rarity.name}
├ Type: ${animatedBadge}
├ Category: ${categoryEmoji} ${cardData.category}
├ Power: ⚔️ ${cardData.power}
└ Value: 💰 ${rarity.value.toLocaleString()}

📅 *Ownership*
├ Obtained: ${obtainedDate}
├ Method: ${obtainedMethod}
├ Favorite: ${isFavorite ? '⭐ Yes' : '☆ No'}
${ownedCard.previousOwner ? `└ Previous: @${ownedCard.previousOwner.split('@')[0]}` : '└ Original Owner: You!'}

*Commands:*
├ ${usedPrefix}fav ${serial} - Add to favorites
├ ${usedPrefix}sendcard @user ${serial} - Gift card
└ ${usedPrefix}sellcard ${serial} - Sell for coins
`.trim()

  const mentions = ownedCard.previousOwner ? [ownedCard.previousOwner] : []
  
  // Send with image if available
  const imageUrl = getCardImage(cardData)
  if (imageUrl && imageUrl !== 'https://via.placeholder.com/400x600') {
    try {
      await conn.sendMessage(m.chat, {
        image: { url: imageUrl },
        caption: replyText,
        mentions
      }, { quoted: m })
    } catch (e) {
      await m.reply(replyText, null, { mentions })
    }
  } else {
    await m.reply(replyText, null, { mentions })
  }
}

handler.help = ['cardinfo <serial>']
handler.tags = ['cards']
handler.command = ['cardinfo', 'cinfo', 'viewcard']
handler.desc = 'View detailed info about an anime card'

export default handler
