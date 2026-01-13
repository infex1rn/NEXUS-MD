/**
 * Card Command: Drop
 * Check drop status and manually trigger drops (owner only)
 * NOTE: Hourly drops are FREE - users just claim with .claim <serial>
 * Gacha/draw with .gacha costs coins
 */
import { 
  createDrop, 
  getActiveDrop, 
  formatDropMessage, 
  getNextDropTime,
  canDrop,
  recordDrop,
  DROP_SETTINGS 
} from '../../lib/cardDrops.js'
import { formatTime } from '../../lib/economy.js'

let handler = async (m, { conn, args, isOwner, usedPrefix }) => {
  const action = args[0]?.toLowerCase()
  
  // Owner can force drop
  if (action === 'force' && isOwner) {
    const drop = createDrop(m.chat)
    recordDrop(m.chat)
    
    const mentions = []
    return m.reply(formatDropMessage(drop), null, { mentions })
  }
  
  // Check current drop
  const activeDrop = getActiveDrop(m.chat)
  
  if (activeDrop) {
    const mentions = activeDrop.cards
      .filter(c => c.claimed && c.claimedBy)
      .map(c => c.claimedBy)
    
    return m.reply(formatDropMessage(activeDrop), null, { mentions })
  }
  
  // No active drop - show next drop time
  const nextDropIn = getNextDropTime(m.chat)
  
  let replyText = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🎴 *FREE CARD DROPS*
╰━━━━━━━━━━━━━━━━━━━━━╯

📦 *No Active Drop*

Anime cards drop automatically every hour - *FOR FREE!*
`

  if (nextDropIn > 0) {
    replyText += `\n⏰ *Next Drop:* ${formatTime(nextDropIn)}`
  } else {
    replyText += `\n✨ *A drop is ready!* Keep chatting...`
  }
  
  replyText += `

*How FREE Drops Work:*
├ 🎴 3 anime cards drop every hour
├ 🆓 Completely FREE to claim!
├ 🏃 First to claim wins!
├ ⏰ Cards expire in 30 minutes
└ 💬 Stay active to catch drops!

*Commands:*
├ ${usedPrefix}claim <serial> - Claim a FREE card
├ ${usedPrefix}cards - View your collection
├ ${usedPrefix}cardinfo <serial> - Card details
└ ${usedPrefix}gacha - Pull cards with coins

_Drops are FREE! Gacha costs coins._
`

  await m.reply(replyText.trim())
}

// Auto-drop on group activity (FREE drops every hour)
handler.before = async (m, { conn, isGroup }) => {
  if (!isGroup || m.isBaileys) return false
  
  const chatId = m.chat
  
  if (!canDrop(chatId)) return false
  if (getActiveDrop(chatId)) return false
  
  // 5% chance to trigger drop when eligible
  if (Math.random() > 0.05) return false
  
  const drop = createDrop(chatId)
  recordDrop(chatId)
  
  // Announce FREE drop
  await conn.sendMessage(chatId, {
    text: `🎉 *FREE ANIME CARD DROP!* 🎉\n\n` + formatDropMessage(drop) + `\n\n_These cards are FREE! Just claim with .claim <serial>_`
  })
  
  return false
}

handler.help = ['drop', 'drop force']
handler.tags = ['cards']
handler.command = ['drop', 'carddrop', 'drops', 'freedrop']
handler.desc = 'Check FREE card drop status'

export default handler
