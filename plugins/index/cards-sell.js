/**
 * Card Command: Sell Card
 * Sell cards for coins
 */
import { initUserCards, getCardById, RARITIES } from '../../lib/cards.js'
import { initUserEconomy, formatMoney, addMoney } from '../../lib/economy.js'

let handler = async (m, { conn, args, usedPrefix }) => {
  const serial = args[0]?.toUpperCase()
  
  if (!serial) {
    return m.reply(`
*Usage:* ${usedPrefix}sellcard <serial>

Sell a card from your collection for coins.
Duplicate cards sell for base value.

Example: ${usedPrefix}sellcard NX-ABC123
`.trim())
  }
  
  const user = global.db.data.users[m.sender]
  const userCards = initUserCards(user)
  const economy = initUserEconomy(user)
  
  // Find card
  const cardIndex = userCards.collection.findIndex(c => 
    c.serial?.toUpperCase() === serial.toUpperCase()
  )
  
  if (cardIndex === -1) {
    return m.reply(`❌ Card not found in your collection!`)
  }
  
  // Check if favorited
  if (userCards.favorites?.includes(serial)) {
    return m.reply(`🔒 This card is favorited! Use *${usedPrefix}unfav ${serial}* first.`)
  }
  
  const ownedCard = userCards.collection[cardIndex]
  const cardData = getCardById(ownedCard.cardId)
  const rarity = RARITIES[cardData?.rarity]
  
  // Calculate sell value (50% of base value)
  const sellValue = Math.floor((rarity?.value || 50) * 0.5)
  
  // Remove card and add money
  userCards.collection.splice(cardIndex, 1)
  addMoney(user, sellValue)
  
  const replyText = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  💰 *CARD SOLD!*
╰━━━━━━━━━━━━━━━━━━━━━╯

${rarity?.emoji || '🎴'} *${cardData?.name}*
├ Serial: \`${serial}\`
├ Rarity: ${rarity?.name || 'Unknown'}
└ Sold for: 💰 ${formatMoney(sellValue)}

💵 *New Balance:* ${formatMoney(economy.wallet)}
🎴 *Cards Remaining:* ${userCards.collection.length}
`.trim()

  await m.reply(replyText)
}

handler.help = ['sellcard <serial>']
handler.tags = ['cards']
handler.command = ['sellcard', 'sell']
handler.desc = 'Sell a card for coins'

export default handler
