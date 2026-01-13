/**
 * Casino Command: Slots
 * Play slot machine
 */
import { initUserEconomy, formatMoney, addMoney, removeMoney, addExp } from '../../lib/economy.js'

const SLOT_SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '🎰']
const PAYOUTS = {
  '7️⃣': 10,    // Jackpot
  '💎': 7,     // Diamond
  '🎰': 5,     // Slot machine
  '🍇': 3,     // Grapes
  '🍊': 2.5,   // Orange
  '🍋': 2,     // Lemon
  '🍒': 1.5    // Cherry
}

// Weighted probabilities
const WEIGHTS = {
  '🍒': 25,
  '🍋': 22,
  '🍊': 20,
  '🍇': 15,
  '💎': 10,
  '🎰': 6,
  '7️⃣': 2
}

function spinReel() {
  const totalWeight = Object.values(WEIGHTS).reduce((a, b) => a + b, 0)
  let random = Math.random() * totalWeight
  
  for (const [symbol, weight] of Object.entries(WEIGHTS)) {
    random -= weight
    if (random <= 0) return symbol
  }
  return '🍒'
}

function spinSlots() {
  return [spinReel(), spinReel(), spinReel()]
}

function calculateWinnings(reels, bet) {
  const [r1, r2, r3] = reels
  
  // Three of a kind
  if (r1 === r2 && r2 === r3) {
    return Math.floor(bet * PAYOUTS[r1])
  }
  
  // Two of a kind
  if (r1 === r2 || r2 === r3 || r1 === r3) {
    const matchSymbol = r1 === r2 ? r1 : r1 === r3 ? r1 : r2
    return Math.floor(bet * (PAYOUTS[matchSymbol] * 0.3))
  }
  
  // Cherry in any position gives small return
  if (reels.includes('🍒')) {
    return Math.floor(bet * 0.5)
  }
  
  return 0
}

let handler = async (m, { conn, args, usedPrefix }) => {
  const user = global.db.data.users[m.sender]
  const economy = initUserEconomy(user)
  
  const bet = parseInt(args[0]) || 100
  const minBet = 10
  const maxBet = 50000
  
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
  
  // Spin slots
  const reels = spinSlots()
  const winnings = calculateWinnings(reels, bet)
  const profit = winnings - bet
  
  // Add winnings
  if (winnings > 0) {
    addMoney(user, winnings)
  }
  
  // XP for playing
  addExp(user, Math.floor(bet / 50))
  
  const isWin = winnings > bet
  const isJackpot = reels[0] === reels[1] && reels[1] === reels[2] && reels[0] === '7️⃣'
  
  let replyText = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🎰 *SLOT MACHINE*
╰━━━━━━━━━━━━━━━━━━━━━╯

┌─────────────┐
│  ${reels[0]}  │  ${reels[1]}  │  ${reels[2]}  │
└─────────────┘

`

  if (isJackpot) {
    replyText += `🎊🎊🎊 *JACKPOT!!!* 🎊🎊🎊\n\n`
  } else if (isWin) {
    replyText += `✅ *YOU WIN!*\n\n`
  } else if (winnings > 0) {
    replyText += `💫 *Partial Return*\n\n`
  } else {
    replyText += `❌ *No Match*\n\n`
  }

  replyText += `💰 *Bet:* ${formatMoney(bet)}\n`
  replyText += `🎁 *Winnings:* ${formatMoney(winnings)}\n`
  replyText += `📊 *Profit:* ${profit >= 0 ? '+' : ''}${formatMoney(profit)}\n\n`
  replyText += `💵 *Balance:* ${formatMoney(economy.wallet)}`

  if (isJackpot) {
    replyText += `\n\n🏆 You hit the legendary 7️⃣7️⃣7️⃣ JACKPOT!`
  }

  await m.reply(replyText.trim())
}

handler.help = ['slots <bet>', 'slot <bet>']
handler.tags = ['casino']
handler.command = ['slots', 'slot', 'slotmachine']
handler.desc = 'Play the slot machine'

export default handler
