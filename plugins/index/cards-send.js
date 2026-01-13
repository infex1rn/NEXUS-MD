/**
 * Card Command: Send/Gift Card
 * Send a card to another user
 */
import { initUserCards, getCardById, RARITIES, CATEGORIES } from '../../lib/cards.js'

let handler = async (m, { conn, args, usedPrefix, command }) => {
  // Check if user is mentioned
  const mentioned = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null)
  
  if (!mentioned) {
    return m.reply(`
*Usage:* ${usedPrefix}${command} @user <serial>

Send a card from your collection to another user.

Example: ${usedPrefix}${command} @user NX-ABC123
`.trim())
  }
  
  if (mentioned === m.sender) {
    return m.reply(`❌ You can't send a card to yourself!`)
  }
  
  // Get serial
  const serial = args.find(arg => arg.toUpperCase().startsWith('NX-'))?.toUpperCase() || 
                 args.find(arg => !arg.startsWith('@'))?.toUpperCase()
  
  if (!serial) {
    return m.reply(`❌ Please specify the card serial!\n\nExample: ${usedPrefix}${command} @user NX-ABC123`)
  }
  
  // Get users
  const sender = global.db.data.users[m.sender]
  const receiver = global.db.data.users[mentioned]
  
  if (!receiver) {
    return m.reply(`❌ User not found in database!`)
  }
  
  const senderCards = initUserCards(sender)
  const receiverCards = initUserCards(receiver)
  
  // Find card in sender's collection
  const cardIndex = senderCards.collection.findIndex(c => 
    c.serial?.toUpperCase() === serial.toUpperCase()
  )
  
  if (cardIndex === -1) {
    return m.reply(`❌ Card not found in your collection!\n\nUse *${usedPrefix}cards* to see your cards.`)
  }
  
  // Check if card is locked
  if (senderCards.favorites?.includes(serial)) {
    return m.reply(`🔒 This card is in your favorites! Remove it first with *${usedPrefix}unfav ${serial}*`)
  }
  
  // Transfer card
  const card = senderCards.collection.splice(cardIndex, 1)[0]
  card.previousOwner = m.sender
  card.transferredAt = Date.now()
  receiverCards.collection.push(card)
  
  // Get card details
  const cardData = getCardById(card.cardId)
  const rarity = RARITIES[cardData?.rarity]
  
  const replyText = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🎁 *CARD SENT!*
╰━━━━━━━━━━━━━━━━━━━━━╯

*From:* @${m.sender.split('@')[0]}
*To:* @${mentioned.split('@')[0]}

${rarity?.emoji || '🎴'} *${cardData?.name || 'Unknown Card'}*
├ Serial: \`${serial}\`
├ Rarity: ${rarity?.name || 'Unknown'}
└ Power: ⚔️ ${cardData?.power || 0}

✅ Transfer successful!
`.trim()

  await m.reply(replyText, null, { mentions: [m.sender, mentioned] })
  
  // Notify receiver
  await conn.sendMessage(mentioned, {
    text: `🎁 *You received a card!*\n\n${rarity?.emoji || '🎴'} *${cardData?.name}* (\`${serial}\`)\nFrom: @${m.sender.split('@')[0]}\n\nUse *.cards* to see your collection!`,
    mentions: [m.sender]
  })
}

handler.help = ['sendcard @user <serial>', 'giftcard @user <serial>']
handler.tags = ['cards']
handler.command = ['sendcard', 'giftcard', 'transfercard', 'givecard']
handler.desc = 'Send a card to another user'

export default handler
