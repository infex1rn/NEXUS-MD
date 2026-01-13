/**
 * Fun Command: 8ball
 * Magic 8-ball answers
 */
const answers = [
  // Positive
  "It is certain.",
  "It is decidedly so.",
  "Without a doubt.",
  "Yes - definitely.",
  "You may rely on it.",
  "As I see it, yes.",
  "Most likely.",
  "Outlook good.",
  "Yes.",
  "Signs point to yes.",
  // Neutral
  "Reply hazy, try again.",
  "Ask again later.",
  "Better not tell you now.",
  "Cannot predict now.",
  "Concentrate and ask again.",
  // Negative
  "Don't count on it.",
  "My reply is no.",
  "My sources say no.",
  "Outlook not so good.",
  "Very doubtful."
]

let handler = async (m, { text, usedPrefix, command }) => {
  if (!text) throw `*Ask a yes/no question!*\n\nExample: *${usedPrefix}${command} Will I be rich?*`
  
  const answer = answers[Math.floor(Math.random() * answers.length)]
  
  m.reply(`🎱 *Magic 8-Ball*\n\n❓ *Question:* ${text}\n\n🔮 *Answer:* ${answer}`)
}

handler.help = ['8ball <question>']
handler.tags = ['fun']
handler.command = ['8ball', 'magic8', 'ask']
handler.desc = 'Ask the magic 8-ball a question'

export default handler
