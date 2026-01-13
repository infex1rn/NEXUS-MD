/**
 * Fun Command: TicTacToe
 * Play tic-tac-toe game (persistent via database)
 */

// Helper to get games from database
function getGames() {
  if (!global.db.data.tictactoeGames) {
    global.db.data.tictactoeGames = {}
  }
  return global.db.data.tictactoeGames
}

let handler = async (m, { conn, text, command, usedPrefix }) => {
  const chatId = m.chat
  const senderId = m.sender
  const games = getGames()
  
  if (command === 'tictactoe' || command === 'ttt') {
    if (!text) {
      throw `*Challenge someone to TicTacToe!*\n\nUsage: *${usedPrefix}${command} @user*\nOr: *${usedPrefix}${command} bot* to play against bot`
    }
    
    const opponent = text.toLowerCase() === 'bot' 
      ? 'bot' 
      : m.mentionedJid?.[0]
    
    if (!opponent) {
      throw '*Please mention someone or type "bot" to play!*'
    }
    
    if (games[chatId]) {
      throw '*A game is already in progress! Use .endgame to end it.*'
    }
    
    games[chatId] = {
      board: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
      player1: senderId,
      player2: opponent,
      currentTurn: senderId,
      symbols: { [senderId]: 'X', [opponent === 'bot' ? 'bot' : opponent]: 'O' },
      createdAt: Date.now()
    }
    
    const boardDisplay = displayBoard(games[chatId].board)
    const turnInfo = opponent === 'bot' ? 'Your turn (X)' : `@${senderId.split('@')[0]}'s turn (X)`
    
    await conn.sendMessage(m.chat, {
      text: `🎮 *TIC-TAC-TOE*\n\n${boardDisplay}\n\n${turnInfo}\n\nReply with a number (1-9) to make your move!`,
      mentions: opponent !== 'bot' ? [senderId, opponent] : [senderId]
    }, { quoted: m })
    
  } else if (command === 'endgame') {
    if (!games[chatId]) {
      throw '*No game in progress!*'
    }
    delete games[chatId]
    m.reply('🎮 *Game ended!*')
  }
}

handler.before = async (m, { conn }) => {
  const chatId = m.chat
  const games = getGames()
  
  if (!games[chatId]) return false
  
  const game = games[chatId]
  const move = parseInt(m.text)
  
  if (isNaN(move) || move < 1 || move > 9) return false
  if (m.sender !== game.currentTurn && game.currentTurn !== 'bot') return false
  
  const index = move - 1
  if (game.board[index] === 'X' || game.board[index] === 'O') {
    m.reply('*That spot is already taken! Choose another.*')
    return true
  }
  
  // Make move
  game.board[index] = game.symbols[m.sender]
  
  // Check for winner
  const winner = checkWinner(game.board)
  if (winner) {
    const boardDisplay = displayBoard(game.board)
    delete games[chatId]
    m.reply(`🎮 *TIC-TAC-TOE*\n\n${boardDisplay}\n\n🎉 *${winner === 'X' ? 'Player 1' : 'Player 2'} WINS!* 🎉`)
    return true
  }
  
  // Check for draw
  if (!game.board.some(cell => !['X', 'O'].includes(cell))) {
    const boardDisplay = displayBoard(game.board)
    delete games[chatId]
    m.reply(`🎮 *TIC-TAC-TOE*\n\n${boardDisplay}\n\n🤝 *It's a DRAW!*`)
    return true
  }
  
  // Switch turn
  game.currentTurn = game.currentTurn === game.player1 ? game.player2 : game.player1
  
  // Bot's turn
  if (game.currentTurn === 'bot') {
    const emptySpots = game.board.map((cell, i) => !['X', 'O'].includes(cell) ? i : null).filter(i => i !== null)
    const botMove = emptySpots[Math.floor(Math.random() * emptySpots.length)]
    game.board[botMove] = 'O'
    
    const botWinner = checkWinner(game.board)
    if (botWinner) {
      const boardDisplay = displayBoard(game.board)
      delete games[chatId]
      m.reply(`🎮 *TIC-TAC-TOE*\n\n${boardDisplay}\n\n🤖 *Bot WINS!*`)
      return true
    }
    
    game.currentTurn = game.player1
  }
  
  const boardDisplay = displayBoard(game.board)
  const nextPlayer = game.currentTurn === 'bot' ? 'Bot' : `@${game.currentTurn.split('@')[0]}`
  
  await conn.sendMessage(m.chat, {
    text: `🎮 *TIC-TAC-TOE*\n\n${boardDisplay}\n\n${nextPlayer}'s turn (${game.symbols[game.currentTurn] || 'O'})`,
    mentions: game.currentTurn !== 'bot' ? [game.currentTurn] : []
  })
  
  return true
}

function displayBoard(board) {
  return `
┌───┬───┬───┐
│ ${board[0]} │ ${board[1]} │ ${board[2]} │
├───┼───┼───┤
│ ${board[3]} │ ${board[4]} │ ${board[5]} │
├───┼───┼───┤
│ ${board[6]} │ ${board[7]} │ ${board[8]} │
└───┴───┴───┘`.trim()
}

function checkWinner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
  ]
  
  for (const [a, b, c] of lines) {
    if (board[a] === board[b] && board[b] === board[c]) {
      return board[a]
    }
  }
  return null
}

handler.help = ['tictactoe @user', 'ttt bot', 'endgame']
handler.tags = ['fun']
handler.command = ['tictactoe', 'ttt', 'endgame']
handler.desc = 'Play tic-tac-toe game'

export default handler
