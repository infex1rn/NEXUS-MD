/**
 * Card Command: Claim
 * Claim cards from drops
 */
import { claimCard, getActiveDrop, formatDropMessage } from '../../lib/cardDrops.js'
import { RARITIES, formatCard, isAnimatedCard, getCardImage } from '../../lib/cards.js'

let handler = async (m, { conn, args, usedPrefix, command }) => {
  const serial = args[0]?.toUpperCase()
  
  // If no serial, show current drop
  if (!serial) {
    const drop = getActiveDrop(m.chat)
    
    if (!drop) {
      return m.reply(`
🎴 *No Active Drop*

There are no anime cards to claim right now!

Cards drop automatically every hour in active groups.
Use *${usedPrefix}drop* to check drop status.
`.trim())
    }
    
    const mentions = drop.cards
      .filter(c => c.claimed && c.claimedBy)
      .map(c => c.claimedBy)
    
    return m.reply(formatDropMessage(drop), null, { mentions })
  }
  
  // Try to claim
  const result = claimCard(m.chat, serial, m.sender)
  
  if (!result.success) {
    return m.reply(`❌ ${result.error}`)
  }
  
  const { card, rarity, allClaimed } = result
  const animatedBadge = rarity.animated ? '🎬 Animated' : '🖼️ Static'
  const specialBadge = rarity.special ? '\n\n👑 *MYTHIC CARD!* The rarest tier!' : ''
  
  let replyText = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  ✅ *CARD CLAIMED!*
╰━━━━━━━━━━━━━━━━━━━━━╯

${rarity.emoji} *${card.name}*
├ Anime: 📺 ${card.anime || 'Unknown'}
├ Serial: \`${card.serial}\`
├ Rarity: ${rarity.name} ${animatedBadge}
├ Power: ⚔️ ${card.power}
├ Category: ${card.category}
└ ${card.description}${specialBadge}

🎉 Congratulations @${m.sender.split('@')[0]}!
`.trim()

  if (allClaimed) {
    replyText += `\n\n📦 _All cards from this drop have been claimed!_`
  }

  // Send card image if available
  if (card.image) {
    try {
      await conn.sendMessage(m.chat, {
        image: { url: card.image },
        caption: replyText,
        mentions: [m.sender]
      }, { quoted: m })
    } catch (e) {
      // If image fails, send text only
      await m.reply(replyText, null, { mentions: [m.sender] })
    }
  } else {
    await m.reply(replyText, null, { mentions: [m.sender] })
  }
}

handler.help = ['claim <serial>', 'claim']
handler.tags = ['cards']
handler.command = ['claim', 'claimcard', 'grab']
handler.desc = 'Claim an anime card from the current drop'

export default handler
