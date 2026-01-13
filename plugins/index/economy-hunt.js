/**
 * Economy Command: Hunt
 * Hunt animals for rewards
 */
import { 
  initUserEconomy, 
  formatMoney, 
  addMoney, 
  addExp,
  canDo, 
  getRemainingCooldown, 
  formatTime,
  pickWeighted,
  COOLDOWNS, 
  HUNT_ANIMALS,
  CURRENCY 
} from '../../lib/economy.js'

let handler = async (m, { conn }) => {
  const user = global.db.data.users[m.sender]
  const economy = initUserEconomy(user)
  
  // Check cooldown
  if (!canDo(economy.lastHunt, COOLDOWNS.hunt)) {
    const remaining = getRemainingCooldown(economy.lastHunt, COOLDOWNS.hunt)
    return m.reply(`⏰ *Hunting Cooldown*\n\nThe forest needs time to repopulate!\n\n⏳ Next hunt in: *${formatTime(remaining)}*`)
  }
  
  // Hunt for animal
  const animal = pickWeighted(HUNT_ANIMALS)
  
  economy.lastHunt = Date.now()
  
  if (animal.value === 0) {
    // Found nothing
    return m.reply(`
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🏹 *HUNTING RESULTS*
╰━━━━━━━━━━━━━━━━━━━━━╯

${animal.emoji} You searched but found nothing...

Better luck next time!

💵 *Wallet:* ${formatMoney(economy.wallet)}
`.trim())
  }
  
  // XP gain
  const expGain = Math.floor(animal.value / 5)
  
  // Apply rewards
  addMoney(user, animal.value)
  const { leveledUp, level } = addExp(user, expGain)
  
  let replyText = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🏹 *HUNTING SUCCESS*
╰━━━━━━━━━━━━━━━━━━━━━╯

You caught a *${animal.name}*! ${animal.emoji}

${CURRENCY.symbol} *Bounty:* +${formatMoney(animal.value)}
✨ *EXP:* +${expGain}

💵 *Wallet:* ${formatMoney(economy.wallet)}
`.trim()

  if (leveledUp) {
    replyText += `\n\n🎉 *LEVEL UP!* You are now level ${level}!`
  }
  
  // Dragon bonus
  if (animal.name === 'Dragon') {
    replyText += `\n\n🐉 *LEGENDARY HUNT!* You slayed a dragon!\n🏆 The kingdom celebrates your victory!`
  }

  await m.reply(replyText)
}

handler.help = ['hunt']
handler.tags = ['economy']
handler.command = ['hunt', 'hunting']
handler.desc = 'Hunt animals for bounty'

export default handler
