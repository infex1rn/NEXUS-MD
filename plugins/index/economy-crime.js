/**
 * Economy Command: Crime
 * Risky way to earn money - can fail and pay fines
 */
import { 
  initUserEconomy, 
  formatMoney, 
  addMoney, 
  removeMoney,
  addExp,
  canDo, 
  getRemainingCooldown, 
  formatTime,
  randomInt,
  COOLDOWNS, 
  REWARDS,
  CRIME_MESSAGES,
  CURRENCY 
} from '../../lib/economy.js'

let handler = async (m, { conn }) => {
  const user = global.db.data.users[m.sender]
  const economy = initUserEconomy(user)
  
  // Check cooldown
  if (!canDo(economy.lastCrime, COOLDOWNS.crime)) {
    const remaining = getRemainingCooldown(economy.lastCrime, COOLDOWNS.crime)
    return m.reply(`⏰ *Crime Cooldown*\n\nLay low for a while...\n\n⏳ Next crime in: *${formatTime(remaining)}*`)
  }
  
  // Pick random crime
  const crime = CRIME_MESSAGES[Math.floor(Math.random() * CRIME_MESSAGES.length)]
  
  // Check if caught based on risk
  const caught = Math.random() < crime.risk
  
  economy.lastCrime = Date.now()
  
  if (caught) {
    // Failed - pay fine
    const fine = randomInt(100, 500)
    const actualFine = Math.min(fine, economy.wallet)
    removeMoney(user, actualFine)
    
    const replyText = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🚔 *BUSTED!*
╰━━━━━━━━━━━━━━━━━━━━━╯

You tried: *${crime.crime}* ${crime.emoji}

❌ You got caught by the police!

💸 *Fine:* -${formatMoney(actualFine)}
💵 *Wallet:* ${formatMoney(economy.wallet)}

_Crime doesn't pay... sometimes._
`.trim()
    
    return m.reply(replyText)
  }
  
  // Success!
  const earnings = randomInt(REWARDS.crime.min, REWARDS.crime.max)
  const expGain = Math.floor(earnings / 8) // Less XP for crime
  
  addMoney(user, earnings)
  const { leveledUp, level } = addExp(user, expGain)
  
  let replyText = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  ${crime.emoji} *CRIME SUCCESS*
╰━━━━━━━━━━━━━━━━━━━━━╯

You did: *${crime.crime}*

✅ You got away with it!

${CURRENCY.symbol} *Loot:* +${formatMoney(earnings)}
✨ *EXP:* +${expGain}

💵 *Wallet:* ${formatMoney(economy.wallet)}
`.trim()

  if (leveledUp) {
    replyText += `\n\n🎉 *LEVEL UP!* You are now level ${level}!`
  }

  await m.reply(replyText)
}

handler.help = ['crime']
handler.tags = ['economy']
handler.command = ['crime', 'steal']
handler.desc = 'Commit crime for money (risky!)'

export default handler
