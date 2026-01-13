/**
 * Fun Command: Dice
 * Roll dice
 */
let handler = async (m, { args }) => {
  const sides = parseInt(args[0]) || 6
  const count = Math.min(parseInt(args[1]) || 1, 10)
  
  if (sides < 2 || sides > 100) throw '*Dice must have 2-100 sides!*'
  
  const rolls = []
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1)
  }
  
  const total = rolls.reduce((a, b) => a + b, 0)
  
  let message = `🎲 *Dice Roll*\n\n`
  message += `*Dice:* ${count}d${sides}\n`
  message += `*Rolls:* ${rolls.join(', ')}\n`
  if (count > 1) message += `*Total:* ${total}`
  
  m.reply(message)
}

handler.help = ['dice [sides] [count]', 'roll [sides] [count]']
handler.tags = ['fun']
handler.command = ['dice', 'roll', 'dadu']
handler.desc = 'Roll dice (default: 1d6)'

export default handler
