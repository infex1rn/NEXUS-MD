/**
 * Games & Fun Commands
 */
import fetch from 'node-fetch'

let handler = async (m, { conn, args, text, usedPrefix, command }) => {
  conn.game = conn.game || {}

  switch (command) {
    case 'trivia': {
      if (conn.game[m.chat]) throw `❌ Game in progress!`
      const res = await fetch('https://opentdb.com/api.php?amount=1&type=multiple')
      const json = await res.json()
      if (!json.results.length) throw `❌ Failed.`
      const data = json.results[0]
      const options = [...data.incorrect_answers, data.correct_answer].sort(() => Math.random() - 0.5)
      const answerIndex = options.indexOf(data.correct_answer)
      let caption = `🧩 *TRIVIA*\n\n*Cat:* ${data.category}\n*Diff:* ${data.difficulty}\n\n❓ *Q:* ${decodeHtml(data.question)}\n\n`
      options.forEach((opt, i) => { caption += `${String.fromCharCode(65 + i)}. ${decodeHtml(opt)}\n` })
      caption += `\n*Reply with A, B, C, or D!*`
      conn.game[m.chat] = {
        type: 'trivia', answer: String.fromCharCode(65 + answerIndex), msg: await m.reply(caption),
        timeout: setTimeout(() => { if (conn.game[m.chat]) { m.reply(`⏰ *Time's up!* Answer was *${String.fromCharCode(65 + answerIndex)}*`); delete conn.game[m.chat] } }, 30000)
      }
      break
    }
    case 'math': {
      if (conn.game[m.chat]) throw `❌ Game in progress!`
      const ops = ['+', '-', '*']; const op = ops[Math.floor(Math.random() * ops.length)]
      const n1 = Math.floor(Math.random() * 50); const n2 = Math.floor(Math.random() * 50)
      const res = eval(`${n1} ${op} ${n2}`)
      conn.game[m.chat] = {
        type: 'math', answer: res.toString(), msg: await m.reply(`🧮 *MATH:* ${n1} ${op} ${n2} = ?`),
        timeout: setTimeout(() => { if (conn.game[m.chat]) { m.reply(`⏰ *Time's up!* Answer was *${res}*`); delete conn.game[m.chat] } }, 20000)
      }
      break
    }
    case 'riddle': {
      if (conn.game[m.chat]) throw `❌ Game in progress!`
      const res = await (await fetch('https://apis.davidcyriltech.my.id/riddle')).json()
      if (!res.success) throw `❌ Failed.`
      const { question, answer } = res.result
      conn.game[m.chat] = {
        type: 'riddle', answer: answer.toLowerCase(), msg: await m.reply(`🤔 *RIDDLE:* ${question}`),
        timeout: setTimeout(() => { if (conn.game[m.chat]) { m.reply(`⏰ *Time's up!* Answer was: *${answer}*`); delete conn.game[m.chat] } }, 45000)
      }
      break
    }
    case 'hangman': {
      if (conn.game[m.chat]) throw `❌ Game in progress!`
      const words = ['nexus', 'bot', 'script', 'code', 'admin']; const word = words[Math.floor(Math.random() * words.length)]
      conn.game[m.chat] = {
        type: 'hangman', word, display: word.replace(/./g, '_'), attempts: [], msg: await m.reply(`🎮 *HANGMAN:* \`${word.replace(/./g, '_')}\` (${word.length} letters)`),
        timeout: setTimeout(() => { if (conn.game[m.chat]) { m.reply(`⏰ *Time's up!* Word was: *${word}*`); delete conn.game[m.chat] } }, 60000)
      }
      break
    }
    case 'wordcheck': {
      if (!text) throw `*Usage:* ${usedPrefix}${command} <word>`
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(text)}`)
      return m.reply(res.ok ? `✅ *${text.toUpperCase()}* is valid!` : `❌ *${text.toUpperCase()}* is invalid.`)
    }
    case 'truth': case 'dare': case 'tod': case 'truthordare': return global.plugins['fun-truthdare.js'].call(conn, m, { conn, usedPrefix, command })
    case '8ball': case 'ask': return global.plugins['fun-8ball.js'].call(conn, m, { conn, usedPrefix, command })
    case 'couple': case 'ship': return global.plugins['fun-couple.js'].call(conn, m, { conn, usedPrefix, command })
    case 'rate': return global.plugins['fun-rate.js'].call(conn, m, { conn, usedPrefix, command })
    case 'joke': return global.plugins['fun-joke.js'].call(conn, m, { conn, usedPrefix, command })
    case 'fact': return global.plugins['fun-fact.js'].call(conn, m, { conn, usedPrefix, command })
    case 'quotes': return global.plugins['fun-quotes.js'].call(conn, m, { conn, usedPrefix, command })
    case 'tictactoe': case 'ttt': return global.plugins['fun-tictactoe.js'].call(conn, m, { conn, usedPrefix, command })
    case 'slots': return global.plugins['casino-slots.js'].call(conn, m, { conn, usedPrefix, command })
    case 'dice': return global.plugins['fun-dice.js'].call(conn, m, { conn, usedPrefix, command })
    case 'quiz': return m.reply('🧩 *QUIZ:* (Alias to Trivia)')
    case 'wordfind': return m.reply('🧩 *WORDFIND:* (Coming Soon)')
    case 'chess': return m.reply('♟️ *CHESS:* (Coming Soon)')
    case 'casino': return m.reply('🎰 *CASINO:* Try `.slots`, `.blackjack`, `.roulette`!')
  }
}

handler.before = async (m, { conn }) => {
  conn.game = conn.game || {}
  if (!conn.game[m.chat]) return false
  const game = conn.game[m.chat]
  if (game.type === 'hangman') {
    const input = m.text.toLowerCase().trim()
    if (input === game.word) { clearTimeout(game.timeout); delete conn.game[m.chat]; m.reply(`🎉 *Correct!*`); return true }
    if (input.length === 1) {
      if (game.attempts.includes(input)) return false
      game.attempts.push(input)
      if (game.word.includes(input)) {
        let n = ''; for (let i = 0; i < game.word.length; i++) n += (game.word[i] === input || game.display[i] !== '_') ? game.word[i] : '_'
        game.display = n; if (game.display === game.word) { clearTimeout(game.timeout); delete conn.game[m.chat]; m.reply(`🎉 *Correct!*`) } else m.reply(`✅ Word: \`${game.display}\``)
        return true
      }
    }
  } else if (m.text.toLowerCase().trim() === game.answer?.toLowerCase()) {
    clearTimeout(game.timeout); delete conn.game[m.chat]; m.reply(`🎉 *Correct!*`); return true
  }
}

handler.help = ['trivia', 'math', 'riddle', 'hangman', 'wordcheck', 'truthordare', '8ball', 'couple', 'rate', 'joke', 'fact', 'quotes', 'tictactoe', 'slots', 'dice', 'quiz', 'wordfind', 'chess', 'casino']
handler.tags = ['fun']
handler.command = ['trivia', 'math', 'riddle', 'hangman', 'wordcheck', 'truth', 'dare', 'tod', 'truthordare', '8ball', 'ask', 'couple', 'ship', 'rate', 'joke', 'fact', 'quotes', 'tictactoe', 'ttt', 'slots', 'dice', 'quiz', 'wordfind', 'chess', 'casino']

export default handler

function decodeHtml(html) {
  return html.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&rsquo;/g, "'")
}
