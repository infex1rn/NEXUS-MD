/**
 * Economy Command: Daily
 * Claim daily reward with streak bonuses
 */
import { 
  initUserEconomy, 
  formatMoney, 
  addMoney, 
  addExp,
  canDo, 
  getRemainingCooldown, 
  formatTime,
  checkStreak,
  getStreakBonus,
  randomInt,
  COOLDOWNS, 
  REWARDS,
  CURRENCY 
} from '../../lib/economy.js'

let handler = async (m, { conn }) => {
  const user = global.db.data.users[m.sender]
  const economy = initUserEconomy(user)
  
  // Check cooldown
  if (!canDo(economy.lastDaily, COOLDOWNS.daily)) {
    const remaining = getRemainingCooldown(economy.lastDaily, COOLDOWNS.daily)
    return m.reply(`⏰ *Daily Cooldown*\n\nYou've already claimed your daily reward!\n\n⏳ Next claim in: *${formatTime(remaining)}*`)
  }
  
  // Calculate streak and bonus
  const streak = checkStreak(user)
  const streakBonus = getStreakBonus(streak)
  
  // Calculate reward
  let reward = randomInt(REWARDS.daily.min, REWARDS.daily.max)
  reward = Math.floor(reward * streakBonus)
  
  // Bonus XP for daily
  const expGain = Math.floor(reward / 10)
  
  // Apply rewards
  addMoney(user, reward)
  const { leveledUp, level } = addExp(user, expGain)
  economy.lastDaily = Date.now()
  
  let replyText = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🎁 *DAILY REWARD*
╰━━━━━━━━━━━━━━━━━━━━━╯

✅ You claimed your daily reward!

${CURRENCY.symbol} *Reward:* +${formatMoney(reward)}
✨ *EXP:* +${expGain}
🔥 *Streak:* ${streak} day(s)
📈 *Bonus:* ${Math.round((streakBonus - 1) * 100)}%

💵 *New Balance:* ${formatMoney(economy.wallet)}
`.trim()

  if (leveledUp) {
    replyText += `\n\n🎉 *LEVEL UP!* You are now level ${level}!`
  }

  // Streak milestones
  if (streak === 7) {
    const bonus = 1000
    addMoney(user, bonus)
    replyText += `\n\n🎊 *WEEKLY STREAK BONUS!* +${formatMoney(bonus)}`
  } else if (streak === 30) {
    const bonus = 10000
    addMoney(user, bonus)
    replyText += `\n\n🏆 *MONTHLY STREAK BONUS!* +${formatMoney(bonus)}`
  }

  replyText += `\n\n_Come back tomorrow to keep your streak!_`

  await m.reply(replyText)
}

handler.help = ['daily']
handler.tags = ['economy']
handler.command = ['daily', 'claim']
handler.desc = 'Claim your daily reward'

export default handler
