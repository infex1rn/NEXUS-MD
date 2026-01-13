/**
 * Casino Command: Roulette
 * Bet on roulette wheel
 */
import { initUserEconomy, formatMoney, addMoney, removeMoney, addExp } from '../../lib/economy.js'

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35]

const PAYOUTS = {
  number: 35,   // Single number
  color: 2,     // Red or black
  evenodd: 2,   // Even or odd
  half: 2,      // 1-18 or 19-36
  dozen: 3,     // 1-12, 13-24, 25-36
  column: 3     // Column bets
}

function spinWheel() {
  return Math.floor(Math.random() * 37) // 0-36
}

function getColor(number) {
  if (number === 0) return 'green'
  return RED_NUMBERS.includes(number) ? 'red' : 'black'
}

function getColorEmoji(color) {
  return color === 'red' ? '🔴' : color === 'black' ? '⚫' : '🟢'
}

let handler = async (m, { conn, args, usedPrefix }) => {
  const user = global.db.data.users[m.sender]
  const economy = initUserEconomy(user)
  
  const betType = args[0]?.toLowerCase()
  const bet = parseInt(args[1]) || parseInt(args[0]) || 100
  
  // Show help
  if (!betType || betType === 'help') {
    return m.reply(`
🎡 *ROULETTE*

*Usage:* ${usedPrefix}roulette <bet type> <amount>

*Bet Types:*
├ *red / black* - Color (2x)
├ *even / odd* - Even/Odd (2x)
├ *low / high* - 1-18/19-36 (2x)
├ *d1 / d2 / d3* - Dozens (3x)
├ *0-36* - Specific number (35x)

*Examples:*
├ ${usedPrefix}roulette red 500
├ ${usedPrefix}roulette 17 1000
└ ${usedPrefix}roulette even 200

💰 Your balance: ${formatMoney(economy.wallet)}
`.trim())
  }
  
  const minBet = 10
  const maxBet = 50000
  
  // Parse bet type
  let betCategory = null
  let betValue = null
  let payout = 0
  
  // Number bet
  const numberBet = parseInt(betType)
  if (!isNaN(numberBet) && numberBet >= 0 && numberBet <= 36) {
    betCategory = 'number'
    betValue = numberBet
    payout = PAYOUTS.number
  }
  // Color bet
  else if (['red', 'r'].includes(betType)) {
    betCategory = 'color'
    betValue = 'red'
    payout = PAYOUTS.color
  }
  else if (['black', 'b'].includes(betType)) {
    betCategory = 'color'
    betValue = 'black'
    payout = PAYOUTS.color
  }
  // Even/Odd
  else if (['even', 'e'].includes(betType)) {
    betCategory = 'evenodd'
    betValue = 'even'
    payout = PAYOUTS.evenodd
  }
  else if (['odd', 'o'].includes(betType)) {
    betCategory = 'evenodd'
    betValue = 'odd'
    payout = PAYOUTS.evenodd
  }
  // High/Low
  else if (['low', 'l', '1-18'].includes(betType)) {
    betCategory = 'half'
    betValue = 'low'
    payout = PAYOUTS.half
  }
  else if (['high', 'h', '19-36'].includes(betType)) {
    betCategory = 'half'
    betValue = 'high'
    payout = PAYOUTS.half
  }
  // Dozens
  else if (['d1', '1st', '1-12'].includes(betType)) {
    betCategory = 'dozen'
    betValue = 1
    payout = PAYOUTS.dozen
  }
  else if (['d2', '2nd', '13-24'].includes(betType)) {
    betCategory = 'dozen'
    betValue = 2
    payout = PAYOUTS.dozen
  }
  else if (['d3', '3rd', '25-36'].includes(betType)) {
    betCategory = 'dozen'
    betValue = 3
    payout = PAYOUTS.dozen
  }
  else {
    return m.reply(`❌ Invalid bet type! Use *${usedPrefix}roulette help* for options.`)
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
  
  // Spin wheel
  const result = spinWheel()
  const resultColor = getColor(result)
  const colorEmoji = getColorEmoji(resultColor)
  
  // Check win
  let won = false
  
  switch (betCategory) {
    case 'number':
      won = result === betValue
      break
    case 'color':
      won = resultColor === betValue
      break
    case 'evenodd':
      if (result === 0) won = false
      else won = (result % 2 === 0) === (betValue === 'even')
      break
    case 'half':
      if (result === 0) won = false
      else won = (result <= 18) === (betValue === 'low')
      break
    case 'dozen':
      if (result === 0) won = false
      else {
        const dozen = Math.ceil(result / 12)
        won = dozen === betValue
      }
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
  switch (betCategory) {
    case 'number': betDesc = `Number ${betValue}`; break
    case 'color': betDesc = `${betValue === 'red' ? '🔴' : '⚫'} ${betValue}`; break
    case 'evenodd': betDesc = betValue; break
    case 'half': betDesc = betValue === 'low' ? '1-18' : '19-36'; break
    case 'dozen': betDesc = `Dozen ${betValue}`; break
  }
  
  let replyText = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🎡 *ROULETTE*
╰━━━━━━━━━━━━━━━━━━━━━╯

*The wheel spins...*

┌─────────────┐
│             │
│  ${colorEmoji}  *${result}*   │
│             │
└─────────────┘

*Result:* ${result} (${resultColor})
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

handler.help = ['roulette <bet> <amount>', 'roulette help']
handler.tags = ['casino']
handler.command = ['roulette', 'roul', 'wheel']
handler.desc = 'Play roulette'

export default handler
