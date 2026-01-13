/**
 * Casino Command: Coinflip
 * Bet on heads or tails
 */
import { initUserEconomy, formatMoney, addMoney, removeMoney, addExp } from '../../lib/economy.js'

let handler = async (m, { conn, args, usedPrefix }) => {
  const user = global.db.data.users[m.sender]
  const economy = initUserEconomy(user)
  
  const choice = args[0]?.toLowerCase()
  const bet = parseInt(args[1]) || parseInt(args[0]) || 100
  
  // Validate choice
  const validHeads = ['heads', 'head', 'h']
  const validTails = ['tails', 'tail', 't']
  
  let side = null
  if (validHeads.includes(choice)) side = 'heads'
  else if (validTails.includes(choice)) side = 'tails'
  
  if (!side) {
    return m.reply(`
🪙 *COINFLIP*

*Usage:* ${usedPrefix}flip <heads/tails> <bet>

Examples:
├ ${usedPrefix}flip heads 500
├ ${usedPrefix}flip t 1000
└ ${usedPrefix}flip h 200

💰 Your balance: ${formatMoney(economy.wallet)}
`.trim())
  }
  
  const minBet = 10
  const maxBet = 100000
  
  if (bet < minBet) {
    return m.reply(`❌ Minimum bet is ${formatMoney(minBet)}!`)
  }
  
  if (bet > maxBet) {
    return m.reply(`❌ Maximum bet is ${formatMoney(maxBet)}!`)
  }
  
  if (economy.wallet < bet) {
    return m.reply(`❌ *Insufficient Funds!*\n\nYou need ${formatMoney(bet)} to play.\nYour balance: ${formatMoney(economy.wallet)}`)
  }
  
  // Deduct bet
  removeMoney(user, bet)
  
  // Flip coin
  const result = Math.random() < 0.5 ? 'heads' : 'tails'
  const resultEmoji = result === 'heads' ? '👑' : '🦅'
  const choiceEmoji = side === 'heads' ? '👑' : '🦅'
  
  const won = result === side
  const winnings = won ? bet * 2 : 0
  const profit = winnings - bet
  
  if (won) {
    addMoney(user, winnings)
  }
  
  // XP
  addExp(user, Math.floor(bet / 100))
  
  let replyText = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🪙 *COINFLIP*
╰━━━━━━━━━━━━━━━━━━━━━╯

*The coin flips through the air...*

┌─────────────┐
│             │
│     ${resultEmoji}      │
│             │
└─────────────┘

*Result:* ${result.toUpperCase()}!
*Your Choice:* ${choiceEmoji} ${side}

`

  if (won) {
    replyText += `✅ *YOU WIN!*\n\n`
  } else {
    replyText += `❌ *YOU LOSE!*\n\n`
  }

  replyText += `💰 *Bet:* ${formatMoney(bet)}\n`
  replyText += `🎁 *Winnings:* ${formatMoney(winnings)}\n`
  replyText += `📊 *Profit:* ${profit >= 0 ? '+' : ''}${formatMoney(profit)}\n\n`
  replyText += `💵 *Balance:* ${formatMoney(economy.wallet)}`

  await m.reply(replyText.trim())
}

handler.help = ['flip <heads/tails> <bet>', 'coinflip <h/t> <bet>']
handler.tags = ['casino']
handler.command = ['flip', 'coinflip', 'cf']
handler.desc = 'Bet on heads or tails'

export default handler
