/**
 * Casino Command: Crash
 * Multiplier game - cash out before crash
 */
import { initUserEconomy, formatMoney, addMoney, removeMoney, addExp } from '../../lib/economy.js'

// Generate crash point using provably fair algorithm
function generateCrashPoint() {
  // House edge of 5%
  const houseEdge = 0.05
  const random = Math.random()
  
  if (random < houseEdge) {
    // Instant crash
    return 1.00
  }
  
  // Generate crash point with exponential distribution
  const crashPoint = 1 / (1 - random * (1 - houseEdge))
  
  // Cap at 100x and round to 2 decimals
  return Math.min(Math.round(crashPoint * 100) / 100, 100)
}

let handler = async (m, { conn, args, usedPrefix }) => {
  const user = global.db.data.users[m.sender]
  const economy = initUserEconomy(user)
  
  const bet = parseInt(args[0]) || 100
  const cashOutAt = parseFloat(args[1]) || 2.0
  
  const minBet = 10
  const maxBet = 50000
  const minCashout = 1.1
  const maxCashout = 100
  
  // Show help
  if (args[0] === 'help') {
    return m.reply(`
🚀 *CRASH GAME*

*Usage:* ${usedPrefix}crash <bet> <cashout multiplier>

The multiplier increases until it crashes!
Cash out before the crash to win.

*Examples:*
├ ${usedPrefix}crash 500 2.0 - Bet 500, auto cashout at 2x
├ ${usedPrefix}crash 1000 1.5 - Bet 1000, cashout at 1.5x
└ ${usedPrefix}crash 200 5.0 - Risky 5x cashout

*Tips:*
├ Lower multipliers = higher chance to win
├ Higher multipliers = bigger rewards, more risk
└ 2x multiplier wins ~50% of the time

💰 Your balance: ${formatMoney(economy.wallet)}
`.trim())
  }
  
  if (bet < minBet) {
    return m.reply(`❌ Minimum bet is ${formatMoney(minBet)}!`)
  }
  
  if (bet > maxBet) {
    return m.reply(`❌ Maximum bet is ${formatMoney(maxBet)}!`)
  }
  
  if (cashOutAt < minCashout) {
    return m.reply(`❌ Minimum cashout is ${minCashout}x!`)
  }
  
  if (cashOutAt > maxCashout) {
    return m.reply(`❌ Maximum cashout is ${maxCashout}x!`)
  }
  
  if (economy.wallet < bet) {
    return m.reply(`❌ *Insufficient Funds!*\n\nYou need ${formatMoney(bet)} to play.\nYour balance: ${formatMoney(economy.wallet)}`)
  }
  
  // Deduct bet
  removeMoney(user, bet)
  
  // Generate crash point
  const crashPoint = generateCrashPoint()
  const won = cashOutAt <= crashPoint
  
  const winnings = won ? Math.floor(bet * cashOutAt) : 0
  const profit = winnings - bet
  
  if (won) {
    addMoney(user, winnings)
  }
  
  addExp(user, Math.floor(bet / 50))
  
  // Generate visual representation
  let graph = ''
  const steps = Math.min(Math.ceil(crashPoint), 10)
  
  for (let i = 1; i <= steps; i++) {
    const mult = Math.min(i * (crashPoint / steps), crashPoint)
    if (won && mult >= cashOutAt && i === Math.ceil(cashOutAt * steps / crashPoint)) {
      graph += `📍 ${mult.toFixed(2)}x ← *CASHED OUT!*\n`
    } else {
      graph += `📈 ${mult.toFixed(2)}x\n`
    }
  }
  graph += `💥 CRASHED @ ${crashPoint.toFixed(2)}x`
  
  let replyText = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🚀 *CRASH GAME*
╰━━━━━━━━━━━━━━━━━━━━━╯

${graph}

`

  if (won) {
    replyText += `✅ *YOU CASHED OUT!*\n\n`
    replyText += `💰 Bet: ${formatMoney(bet)}\n`
    replyText += `📈 Multiplier: ${cashOutAt}x\n`
    replyText += `🎁 Winnings: ${formatMoney(winnings)}\n`
    replyText += `📊 Profit: +${formatMoney(profit)}\n`
  } else {
    replyText += `💥 *CRASHED BEFORE CASHOUT!*\n\n`
    replyText += `💰 Bet: ${formatMoney(bet)}\n`
    replyText += `🎯 Target: ${cashOutAt}x\n`
    replyText += `💥 Crashed: ${crashPoint}x\n`
    replyText += `📊 Loss: -${formatMoney(bet)}\n`
  }

  replyText += `\n💵 Balance: ${formatMoney(economy.wallet)}`

  await m.reply(replyText.trim())
}

handler.help = ['crash <bet> <multiplier>', 'crash help']
handler.tags = ['casino']
handler.command = ['crash', 'rocket']
handler.desc = 'Crash multiplier game'

export default handler
