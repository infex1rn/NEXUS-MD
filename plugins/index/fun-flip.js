/**
 * Fun Command: Flip Coin
 * Flip a coin
 */
let handler = async (m) => {
  const result = Math.random() < 0.5 ? 'Heads' : 'Tails'
  const emoji = result === 'Heads' ? '🪙' : '🔵'
  
  m.reply(`${emoji} *Coin Flip*\n\nResult: *${result}*`)
}

handler.help = ['flip', 'coin']
handler.tags = ['fun']
handler.command = ['flip', 'coin', 'coinflip']
handler.desc = 'Flip a coin (heads or tails)'

export default handler
