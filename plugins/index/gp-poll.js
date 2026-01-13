/**
 * Group Command: Poll
 * Create a WhatsApp poll
 */
let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    throw `*Please provide poll question and options!*\n\nUsage: *${usedPrefix}${command} Question | Option1 | Option2 | Option3*\n\nExample: *${usedPrefix}${command} Best programming language? | JavaScript | Python | Java*`
  }
  
  const parts = text.split('|').map(p => p.trim()).filter(p => p)
  
  if (parts.length < 3) {
    throw '*You need at least a question and 2 options!*\n\nExample: `.poll Favorite color? | Red | Blue | Green`'
  }
  
  const question = parts[0]
  const options = parts.slice(1)
  
  if (options.length > 12) {
    throw '*Maximum 12 options allowed!*'
  }
  
  try {
    await conn.sendPoll(m.chat, question, options.map(o => [o]), { quoted: m })
    m.reply('✅ *Poll created successfully!*')
  } catch (e) {
    m.reply(`❌ Error creating poll: ${e.message}`)
  }
}

handler.help = ['poll <question> | <option1> | <option2>']
handler.tags = ['group']
handler.command = ['poll', 'vote']
handler.desc = 'Create a WhatsApp poll'
handler.group = true

export default handler
