/**
 * Casino Command: Blackjack
 * Play blackjack against the dealer (persistent via database)
 */
import { initUserEconomy, formatMoney, addMoney, removeMoney, addExp } from '../../lib/economy.js'

const CARDS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const SUITS = ['♠️', '♥️', '♦️', '♣️']

// Helper to get active games from database
function getActiveGames() {
  if (!global.db.data.blackjackGames) {
    global.db.data.blackjackGames = {}
  }
  // Clean up expired games (older than 5 minutes)
  const now = Date.now()
  for (const [key, game] of Object.entries(global.db.data.blackjackGames)) {
    if (now - game.startedAt > 5 * 60 * 1000) {
      delete global.db.data.blackjackGames[key]
    }
  }
  return global.db.data.blackjackGames
}

function createDeck() {
  const deck = []
  for (const suit of SUITS) {
    for (const card of CARDS) {
      deck.push({ card, suit, display: `${card}${suit}` })
    }
  }
  return shuffle(deck)
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

function getCardValue(card) {
  if (['J', 'Q', 'K'].includes(card)) return 10
  if (card === 'A') return 11
  return parseInt(card)
}

function calculateHand(cards) {
  let value = 0
  let aces = 0
  
  for (const card of cards) {
    value += getCardValue(card.card)
    if (card.card === 'A') aces++
  }
  
  while (value > 21 && aces > 0) {
    value -= 10
    aces--
  }
  
  return value
}

function formatHand(cards, hideSecond = false) {
  if (hideSecond && cards.length >= 2) {
    return `${cards[0].display} 🂠`
  }
  return cards.map(c => c.display).join(' ')
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
  const user = global.db.data.users[m.sender]
  const economy = initUserEconomy(user)
  const gameKey = `${m.chat}-${m.sender}`
  const activeGames = getActiveGames()
  
  // Check for active game
  const activeGame = activeGames[gameKey]
  
  // Handle hit/stand for active game
  if (activeGame) {
    const action = args[0]?.toLowerCase() || command.toLowerCase()
    
    if (action === 'hit' || action === 'h') {
      // Draw card
      const card = activeGame.deck.pop()
      activeGame.playerHand.push(card)
      const playerValue = calculateHand(activeGame.playerHand)
      
      if (playerValue > 21) {
        // Bust
        delete activeGames[gameKey]
        
        return m.reply(`
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🃏 *BLACKJACK*
╰━━━━━━━━━━━━━━━━━━━━━╯

*Your Hand:* ${formatHand(activeGame.playerHand)}
*Value:* ${playerValue}

💥 *BUST!* You went over 21!

❌ *You lose ${formatMoney(activeGame.bet)}*
💵 Balance: ${formatMoney(economy.wallet)}
`.trim())
      }
      
      return m.reply(`
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🃏 *BLACKJACK*
╰━━━━━━━━━━━━━━━━━━━━━╯

*Dealer:* ${formatHand(activeGame.dealerHand, true)}

*Your Hand:* ${formatHand(activeGame.playerHand)}
*Value:* ${playerValue}

💰 *Bet:* ${formatMoney(activeGame.bet)}

*${usedPrefix}hit* - Draw another card
*${usedPrefix}stand* - Keep your hand
`.trim())
    }
    
    if (action === 'stand' || action === 's' || action === 'stay') {
      // Dealer plays
      let dealerValue = calculateHand(activeGame.dealerHand)
      
      while (dealerValue < 17) {
        const card = activeGame.deck.pop()
        activeGame.dealerHand.push(card)
        dealerValue = calculateHand(activeGame.dealerHand)
      }
      
      const playerValue = calculateHand(activeGame.playerHand)
      
      let result, winnings, profit
      
      if (dealerValue > 21) {
        // Dealer bust
        result = '✅ *DEALER BUST! YOU WIN!*'
        winnings = activeGame.bet * 2
        profit = activeGame.bet
      } else if (playerValue > dealerValue) {
        result = '✅ *YOU WIN!*'
        winnings = activeGame.bet * 2
        profit = activeGame.bet
      } else if (playerValue < dealerValue) {
        result = '❌ *DEALER WINS!*'
        winnings = 0
        profit = -activeGame.bet
      } else {
        result = '🤝 *PUSH! (Tie)*'
        winnings = activeGame.bet
        profit = 0
      }
      
      if (winnings > 0) {
        addMoney(user, winnings)
      }
      
      addExp(user, Math.floor(activeGame.bet / 50))
      delete activeGames[gameKey]
      
      return m.reply(`
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🃏 *BLACKJACK*
╰━━━━━━━━━━━━━━━━━━━━━╯

*Dealer:* ${formatHand(activeGame.dealerHand)}
*Dealer Value:* ${dealerValue}

*Your Hand:* ${formatHand(activeGame.playerHand)}
*Your Value:* ${playerValue}

${result}

💰 Bet: ${formatMoney(activeGame.bet)}
🎁 Winnings: ${formatMoney(winnings)}
📊 Profit: ${profit >= 0 ? '+' : ''}${formatMoney(profit)}

💵 Balance: ${formatMoney(economy.wallet)}
`.trim())
    }
    
    return m.reply(`You have an active game!\n\n*${usedPrefix}hit* - Draw card\n*${usedPrefix}stand* - Keep hand`)
  }
  
  // Start new game
  const bet = parseInt(args[0]) || 100
  const minBet = 50
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
  
  // Create game
  const deck = createDeck()
  const playerHand = [deck.pop(), deck.pop()]
  const dealerHand = [deck.pop(), deck.pop()]
  
  const playerValue = calculateHand(playerHand)
  const dealerValue = calculateHand(dealerHand)
  
  // Check for blackjack
  if (playerValue === 21) {
    const winnings = Math.floor(bet * 2.5) // Blackjack pays 3:2
    addMoney(user, winnings)
    addExp(user, Math.floor(bet / 20))
    
    return m.reply(`
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🃏 *BLACKJACK!*
╰━━━━━━━━━━━━━━━━━━━━━╯

*Dealer:* ${formatHand(dealerHand)}

*Your Hand:* ${formatHand(playerHand)}
*Value:* 21

🎰 *BLACKJACK! YOU WIN!*

💰 Bet: ${formatMoney(bet)}
🎁 Winnings: ${formatMoney(winnings)} (1.5x bonus!)

💵 Balance: ${formatMoney(economy.wallet)}
`.trim())
  }
  
  // Store game state in database
  activeGames[gameKey] = {
    deck,
    playerHand,
    dealerHand,
    bet,
    startedAt: Date.now()
  }
  
  await m.reply(`
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🃏 *BLACKJACK*
╰━━━━━━━━━━━━━━━━━━━━━╯

*Dealer:* ${formatHand(dealerHand, true)}

*Your Hand:* ${formatHand(playerHand)}
*Value:* ${playerValue}

💰 *Bet:* ${formatMoney(bet)}

*${usedPrefix}hit* - Draw another card
*${usedPrefix}stand* - Keep your hand
`.trim())
}

handler.help = ['blackjack <bet>', 'bj <bet>', 'hit', 'stand']
handler.tags = ['casino']
handler.command = ['blackjack', 'bj', 'hit', 'stand', 'stay']
handler.desc = 'Play blackjack against the dealer'

export default handler
