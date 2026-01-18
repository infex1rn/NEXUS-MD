/**
 * Economy Command: Balance
 * Check wallet and bank balance
 */
import { initUserEconomy, formatMoney, calculateLevel, xpForLevel, CURRENCY } from '../../lib/economy.js'
import { formatMessage } from '../../lib/simple.js'

let handler = async (m, { conn }) => {
  const user = global.db.data.users[m.sender]
  const economy = initUserEconomy(user)
  
  const nextLevelXp = xpForLevel(economy.level + 1)
  const progress = Math.round((economy.exp / nextLevelXp) * 100)
  const progressBar = generateProgressBar(progress)
  
  const body = `👤 *User:* ${user.name || m.sender.split('@')[0]}

💵 *Wallet:* ${formatMoney(economy.wallet)}
🏦 *Bank:* ${formatMoney(economy.bank)}
💎 *Total:* ${formatMoney(economy.wallet + economy.bank)}

📊 *Level:* ${economy.level}
✨ *EXP:* ${economy.exp.toLocaleString()} / ${nextLevelXp.toLocaleString()}
${progressBar} ${progress}%

📈 *Stats:*
├ Total Earned: ${formatMoney(economy.totalEarned)}
├ Total Spent: ${formatMoney(economy.totalSpent)}
├ Work Count: ${economy.workCount}
└ Current Streak: 🔥 ${economy.streak} day(s)`

  await m.reply(formatMessage(`${CURRENCY.emoji} NEXUS WALLET`, body, 'Use .help economy for more commands'))
}

function generateProgressBar(percent, length = 10) {
  const filled = Math.round((percent / 100) * length)
  const empty = length - filled
  return '▓'.repeat(filled) + '░'.repeat(empty)
}

handler.help = ['balance', 'bal', 'wallet']
handler.tags = ['economy']
handler.command = ['balance', 'bal', 'wallet', 'money', 'cash']
handler.desc = 'Check your wallet and bank balance'

export default handler
