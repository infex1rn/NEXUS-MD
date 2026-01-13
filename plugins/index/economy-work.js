/**
 * Economy Command: Work
 * Work to earn money
 */
import { 
  initUserEconomy, 
  formatMoney, 
  addMoney, 
  addExp,
  canDo, 
  getRemainingCooldown, 
  formatTime,
  randomInt,
  COOLDOWNS, 
  REWARDS,
  WORK_MESSAGES,
  CURRENCY 
} from '../../lib/economy.js'

let handler = async (m, { conn }) => {
  const user = global.db.data.users[m.sender]
  const economy = initUserEconomy(user)
  
  // Check cooldown
  if (!canDo(economy.lastWork, COOLDOWNS.work)) {
    const remaining = getRemainingCooldown(economy.lastWork, COOLDOWNS.work)
    return m.reply(`⏰ *Work Cooldown*\n\nYou're tired! Take a break.\n\n⏳ Next work in: *${formatTime(remaining)}*`)
  }
  
  // Pick random job
  const job = WORK_MESSAGES[Math.floor(Math.random() * WORK_MESSAGES.length)]
  
  // Calculate earnings
  let earnings = randomInt(REWARDS.work.min, REWARDS.work.max)
  earnings = Math.floor(earnings * job.bonus)
  
  // XP gain
  const expGain = Math.floor(earnings / 5)
  
  // Apply rewards
  addMoney(user, earnings)
  const { leveledUp, level } = addExp(user, expGain)
  economy.lastWork = Date.now()
  economy.workCount++
  
  let replyText = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  ${job.emoji} *WORK COMPLETE*
╰━━━━━━━━━━━━━━━━━━━━━╯

You worked as a *${job.job}*!

${CURRENCY.symbol} *Earnings:* +${formatMoney(earnings)}
✨ *EXP:* +${expGain}

💵 *Wallet:* ${formatMoney(economy.wallet)}
📊 *Total Jobs:* ${economy.workCount}
`.trim()

  if (leveledUp) {
    replyText += `\n\n🎉 *LEVEL UP!* You are now level ${level}!`
  }

  // Random bonus chance
  if (Math.random() < 0.1) { // 10% chance
    const bonus = randomInt(50, 200)
    addMoney(user, bonus)
    replyText += `\n\n🎁 *BONUS TIP!* A customer gave you ${formatMoney(bonus)}!`
  }

  await m.reply(replyText)
}

handler.help = ['work']
handler.tags = ['economy']
handler.command = ['work', 'job']
handler.desc = 'Work to earn money'

export default handler
