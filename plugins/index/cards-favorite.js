/**
 * Card Command: Favorite
 * Add/remove cards from favorites (protected from accidental trades)
 */
import { initUserCards, getCardById, RARITIES } from '../../lib/cards.js'

let handler = async (m, { conn, args, usedPrefix, command }) => {
  const serial = args[0]?.toUpperCase()
  
  if (!serial) {
    return m.reply(`
*Usage:* 
├ ${usedPrefix}fav <serial> - Add to favorites
└ ${usedPrefix}unfav <serial> - Remove from favorites

Favorited cards are protected from accidental trades!
`.trim())
  }
  
  const user = global.db.data.users[m.sender]
  const userCards = initUserCards(user)
  
  // Initialize favorites array
  if (!userCards.favorites) userCards.favorites = []
  
  // Find card
  const ownedCard = userCards.collection.find(c => 
    c.serial?.toUpperCase() === serial.toUpperCase()
  )
  
  if (!ownedCard) {
    return m.reply(`❌ Card not found in your collection!`)
  }
  
  const cardData = getCardById(ownedCard.cardId)
  const rarity = RARITIES[cardData?.rarity]
  
  const isFav = userCards.favorites.includes(serial)
  
  if (command === 'unfav' || command === 'unfavorite') {
    // Remove from favorites
    if (!isFav) {
      return m.reply(`❌ This card is not in your favorites!`)
    }
    
    userCards.favorites = userCards.favorites.filter(s => s !== serial)
    
    return m.reply(`
☆ *Removed from Favorites*

${rarity?.emoji || '🎴'} *${cardData?.name}*
Serial: \`${serial}\`

This card can now be traded.
`.trim())
  } else {
    // Add to favorites
    if (isFav) {
      return m.reply(`⭐ This card is already in your favorites!`)
    }
    
    if (userCards.favorites.length >= 50) {
      return m.reply(`❌ You can only have 50 favorites! Remove some first.`)
    }
    
    userCards.favorites.push(serial)
    
    return m.reply(`
⭐ *Added to Favorites*

${rarity?.emoji || '🎴'} *${cardData?.name}*
Serial: \`${serial}\`

This card is now protected from trades!
`.trim())
  }
}

handler.help = ['fav <serial>', 'unfav <serial>']
handler.tags = ['cards']
handler.command = ['fav', 'favorite', 'unfav', 'unfavorite', 'lock', 'unlock']
handler.desc = 'Favorite/unfavorite a card'

export default handler
