/**
 * Admin Command: Anti-Link
 * Enable/disable anti-link protection
 */
let handler = async (m, { conn, text, command }) => {
  let chat = global.db.data.chats[m.chat]
  
  if (command === 'antilink') {
    if (!text) {
      const status = chat.antiLink ? 'ON ✅' : 'OFF ❌'
      return m.reply(`*Anti-Link Status:* ${status}\n\nUse \`.antilink on\` or \`.antilink off\` to toggle.`)
    }
    
    if (text.toLowerCase() === 'on') {
      chat.antiLink = true
      m.reply('✅ *Anti-Link enabled!*\nUsers who send links will be warned/kicked.')
    } else if (text.toLowerCase() === 'off') {
      chat.antiLink = false
      m.reply('❌ *Anti-Link disabled!*')
    } else {
      m.reply('*Usage:* `.antilink on` or `.antilink off`')
    }
  }
}

handler.before = async (m, { conn, isAdmin, isBotAdmin }) => {
  if (!m.isGroup) return false
  let chat = global.db.data.chats[m.chat]
  if (!chat?.antiLink) return false
  if (isAdmin) return false
  if (!isBotAdmin) return false
  
  // Check for links
  const linkRegex = /https?:\/\/|wa\.me|whatsapp\.com|chat\.whatsapp|t\.me|telegram\./gi
  if (linkRegex.test(m.text)) {
    await conn.sendMessage(m.chat, { delete: m.key })
    
    let user = global.db.data.users[m.sender]
    user.warn = (user.warn || 0) + 1
    
    if (user.warn >= global.maxwarn) {
      await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
      m.reply(`⚠️ @${m.sender.split('@')[0]} has been kicked for sending links (${user.warn} warnings)!`, null, { mentions: [m.sender] })
      user.warn = 0
    } else {
      m.reply(`⚠️ @${m.sender.split('@')[0]}, links are not allowed! Warning ${user.warn}/${global.maxwarn}`, null, { mentions: [m.sender] })
    }
    return true
  }
  return false
}

handler.help = ['antilink on/off']
handler.tags = ['group']
handler.command = ['antilink']
handler.desc = 'Enable/disable anti-link protection'
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler
