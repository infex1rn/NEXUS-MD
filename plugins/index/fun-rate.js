/**
 * Fun Command: Rate
 * Rate something out of 10
 */
let handler = async (m, { text, usedPrefix, command }) => {
  if (!text) throw `*What should I rate?*\n\nExample: *${usedPrefix}${command} my coding skills*`
  
  const rating = Math.floor(Math.random() * 11)
  const stars = '⭐'.repeat(rating) + '☆'.repeat(10 - rating)
  
  let comment
  if (rating <= 2) comment = 'Oof... needs improvement 😬'
  else if (rating <= 4) comment = 'Not bad, but could be better 🤔'
  else if (rating <= 6) comment = 'Pretty decent! 👍'
  else if (rating <= 8) comment = 'Impressive! 🔥'
  else comment = 'Absolutely amazing! 🌟'
  
  m.reply(`📊 *Rating*\n\n"${text}"\n\n${stars}\n*${rating}/10*\n\n${comment}`)
}

handler.help = ['rate <something>']
handler.tags = ['fun']
handler.command = ['rate', 'rating']
handler.desc = 'Rate something out of 10'

export default handler
