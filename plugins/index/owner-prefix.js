/**
 * Owner Command: Set Prefix
 * Change bot prefix
 */
let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (command === 'resetprefix') {
    global.prefix = new RegExp('^[./*#!$%&]')
    return m.reply('✅ *Prefix reset to default!*')
  }
  
  if (!text) throw `*Please provide a new prefix!*\n\nExample: *${usedPrefix}setprefix !*`
  
  if (text.length > 1) throw '*Prefix should be a single character!*'
  
  try {
    const escapedPrefix = text.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
    global.prefix = new RegExp(`^[${escapedPrefix}]`)
    
    m.reply(`✅ *Prefix changed to:* ${text}\n\nNow use commands like: *${text}menu*`)
  } catch (e) {
    m.reply(`❌ Error: ${e.message}`)
  }
}

handler.help = ['setprefix <char>', 'resetprefix']
handler.tags = ['owner']
handler.command = ['setprefix', 'prefix', 'resetprefix']
handler.desc = 'Change or reset bot prefix'
handler.owner = true

export default handler
