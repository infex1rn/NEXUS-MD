/**
 * Casino Command: Dice
 * Bet on dice roll outcome
 */
import { initUserEconomy, formatMoney, addMoney, removeMoney, addExp } from '../../lib/economy.js'

const DICE_EMOJI = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

function rollDice() {
  return Math.floor(Math.random() * 6) + 1
}

let handler = async (m, { conn, args, usedPrefix }) => {
  const user = global.db.data.users[m.sender]
  const economy = initUserEconomy(user)
  
  const prediction = args[0]?.toLowerCase()
  const bet = parseInt(args[1]) || 100
  
  // Show help
  if (!prediction || prediction === 'help') {
    return m.reply(`
🎲 *DICE GAME*

*Usage:* ${usedPrefix}dice <prediction> <amount>

*Predictions:*
├ *1-6* - Exact number (5x)
├ *high* - Roll 4-6 (2x)
├ *low* - Roll 1-3 (2x)
├ *even* - Roll 2,4,6 (2x)
├ *odd* - Roll 1,3,5 (2x)

*Examples:*
├ ${usedPrefix}dice 6 500
├ ${usedPrefix}dice high 1000
└ ${usedPrefix}dice even 200

💰 Your balance: ${formatMoney(economy.wallet)}
`.trim())
  }
  
  const minBet = 10
  const maxBet = 50000
  
  // Parse prediction
  let betType = null
  let betValue = null
  let payout = 0
  
  const numberBet = parseInt(prediction)
  if (!isNaN(numberBet) && numberBet >= 1 && numberBet <= 6) {
    betType = 'number'
    betValue = numberBet
    payout = 5
  }
  else if (['high', 'h'].includes(prediction)) {
    betType = 'high'
    payout = 2
  }
  else if (['low', 'l'].includes(prediction)) {
    betType = 'low'
    payout = 2
  }
  else if (['even', 'e'].includes(prediction)) {
    betType = 'even'
    payout = 2
  }
  else if (['odd', 'o'].includes(prediction)) {
    betType = 'odd'
    payout = 2
  }
  else {
    return m.reply(`❌ Invalid prediction! Use *${usedPrefix}dice help* for options.`)
  }
  
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
  
  // Roll dice
  const result = rollDice()
  const diceEmoji = DICE_EMOJI[result - 1]
  
  // Check win
  let won = false
  
  switch (betType) {
    case 'number':
      won = result === betValue
      break
    case 'high':
      won = result >= 4
      break
    case 'low':
      won = result <= 3
      break
    case 'even':
      won = result % 2 === 0
      break
    case 'odd':
      won = result % 2 === 1
      break
  }
  
  const winnings = won ? bet * payout : 0
  const profit = winnings - bet
  
  if (won) {
    addMoney(user, winnings)
  }
  
  addExp(user, Math.floor(bet / 100))
  
  // Format bet description
  let betDesc = ''
  switch (betType) {
    case 'number': betDesc = `Number ${betValue}`; break
    case 'high': betDesc = 'High (4-6)'; break
    case 'low': betDesc = 'Low (1-3)'; break
    case 'even': betDesc = 'Even'; break
    case 'odd': betDesc = 'Odd'; break
  }
  
  let replyText = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🎲 *DICE GAME*
╰━━━━━━━━━━━━━━━━━━━━━╯

*Rolling the dice...*

┌─────────────┐
│             │
│     ${diceEmoji}      │
│             │
└─────────────┘

*Result:* ${result}
*Your Bet:* ${betDesc}

`

  if (won) {
    replyText += `✅ *YOU WIN!*\n\n`
  } else {
    replyText += `❌ *NO LUCK!*\n\n`
  }

  replyText += `💰 Bet: ${formatMoney(bet)}\n`
  replyText += `🎁 Winnings: ${formatMoney(winnings)} (${payout}x)\n`
  replyText += `📊 Profit: ${profit >= 0 ? '+' : ''}${formatMoney(profit)}\n\n`
  replyText += `💵 Balance: ${formatMoney(economy.wallet)}`

  await m.reply(replyText.trim())
}

handler.help = ['dice <prediction> <amount>', 'dice help']
handler.tags = ['casino']
handler.command = ['dice', 'roll']
handler.desc = 'Bet on dice roll'

export default handler
