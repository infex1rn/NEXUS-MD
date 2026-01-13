/**
 * Card Command: Drop
 * Check drop status and manually trigger drops (owner only)
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
┃  🎴 *CARD DROPS*
╰━━━━━━━━━━━━━━━━━━━━━╯

📦 *No Active Drop*

Cards drop automatically every hour!
`

  if (nextDropIn > 0) {
    replyText += `\n⏰ *Next Drop:* ${formatTime(nextDropIn)}`
  } else {
    replyText += `\n✨ *A drop is ready!* Keep chatting...`
  }
  
  replyText += `

*How it works:*
├ 🎴 3 cards drop every hour
├ 🏃 First to claim wins!
├ ⏰ Cards expire in 30 minutes
└ 💬 Stay active to catch drops!

*Commands:*
├ ${usedPrefix}claim <serial> - Claim a card
├ ${usedPrefix}cards - View your collection
└ ${usedPrefix}cardinfo <serial> - Card details
`

  await m.reply(replyText.trim())
}

// Auto-drop on group activity
handler.before = async (m, { conn, isGroup }) => {
  if (!isGroup || m.isBaileys) return false
  
  // Only process in groups with activity
  const chatId = m.chat
  
  // Check if eligible for drop
  if (!canDrop(chatId)) return false
  
  // Check if there's already an active drop
  if (getActiveDrop(chatId)) return false
  
  // Random chance to trigger drop (5% on each message when eligible)
  if (Math.random() > 0.05) return false
  
  // Create drop
  const drop = createDrop(chatId)
  recordDrop(chatId)
  
  // Announce drop
  await conn.sendMessage(chatId, {
    text: formatDropMessage(drop)
  })
  
  return false
}

handler.help = ['drop', 'drop force']
handler.tags = ['cards']
handler.command = ['drop', 'carddrop', 'drops']
handler.desc = 'Check card drop status'

export default handler
