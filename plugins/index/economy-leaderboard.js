/**
 * Economy Command: Leaderboard
 * Show richest users
 */
import { 
  initUserEconomy, 
  formatMoney, 
  getLeaderboard,
  CURRENCY 
} from '../../lib/economy.js'

let handler = async (m, { conn, args }) => {
  const users = global.db.data.users
  
  // Get sort type
  const sortType = args[0]?.toLowerCase() || 'total'
  const validTypes = ['total', 'wallet', 'bank', 'level', 'exp']
  const type = validTypes.includes(sortType) ? sortType : 'total'
  
  const leaderboard = getLeaderboard(users, type, 10)
  
  if (leaderboard.length === 0) {
    return m.reply(`📊 No users with economy data yet!`)
  }
  
  const typeEmoji = {
    total: '💎',
    wallet: '💵',
    bank: '🏦',
    level: '📊',
    exp: '✨'
  }
  
  const typeNames = {
    total: 'Total Wealth',
    wallet: 'Wallet',
    bank: 'Bank',
    level: 'Level',
    exp: 'Experience'
  }
  
  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
  
  let leaderboardText = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  ${typeEmoji[type]} *LEADERBOARD*
┃  _${typeNames[type]}_
╰━━━━━━━━━━━━━━━━━━━━━╯

`

  leaderboard.forEach((entry, index) => {
    const value = type === 'level' ? `Level ${entry.level}` : 
                  type === 'exp' ? `${entry.exp.toLocaleString()} XP` :
                  formatMoney(entry[type])
    
    leaderboardText += `${medals[index]} *${entry.name}*\n`
    leaderboardText += `   └ ${value}\n\n`
  })

  // Find user's rank
  const allRanked = Object.entries(users)
    .filter(([, user]) => user.economy)
    .map(([jid, user]) => ({
      jid,
      total: (user.economy?.wallet || 0) + (user.economy?.bank || 0),
      wallet: user.economy?.wallet || 0,
      bank: user.economy?.bank || 0,
      level: user.economy?.level || 1,
      exp: user.economy?.exp || 0
    }))
    .sort((a, b) => b[type] - a[type])
  
  const userRank = allRanked.findIndex(u => u.jid === m.sender) + 1
  const userData = allRanked.find(u => u.jid === m.sender)
  
  if (userRank > 0) {
    const userValue = type === 'level' ? `Level ${userData.level}` : 
                      type === 'exp' ? `${userData.exp.toLocaleString()} XP` :
                      formatMoney(userData[type])
    leaderboardText += `━━━━━━━━━━━━━━━━━━━━━\n`
    leaderboardText += `📍 *Your Rank:* #${userRank}\n`
    leaderboardText += `   └ ${userValue}`
  }

  leaderboardText += `\n\n_Filters: total, wallet, bank, level, exp_`

  await m.reply(leaderboardText)
}

handler.help = ['leaderboard [type]', 'richest', 'top']
handler.tags = ['economy']
handler.command = ['leaderboard', 'lb', 'richest', 'top', 'rich']
handler.desc = 'Show top richest users'

export default handler
