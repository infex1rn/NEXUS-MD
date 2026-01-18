/**
 * Admin Command: Warn
 * Warn a user, auto-kick at 3 warnings
 */
let handler = async (m, { conn, text }) => {
  let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : false
  
  if (!who) return m.reply('*Tag or reply to the person you want to warn!*')
  
  // Check if trying to warn bot or owner
  if (who === conn.user.jid) return m.reply("*I can't warn myself!*")
  if (global.owner.some(user => user.replace(/[^0-9]/g, '') === who.replace(/[^0-9]/g, ''))) return m.reply("*I can't warn the bot owner!*")
  
  let user = global.db.data.users[who]
  if (!user) global.db.data.users[who] = { warn: 0 }
  user = global.db.data.users[who]
  
  user.warn = (user.warn || 0) + 1
  
  if (user.warn >= global.maxwarn) {
    try {
      await conn.groupParticipantsUpdate(m.chat, [who], 'remove')
      m.reply(`⚠️ @${who.split('@')[0]} has been kicked for reaching ${global.maxwarn} warnings!`, null, { mentions: [who] })
      user.warn = 0
    } catch (e) {
      m.reply(`❌ Failed to kick: ${e.message}`)
    }
  } else {
    m.reply(`⚠️ @${who.split('@')[0]} has been warned!\n\n*Warnings:* ${user.warn}/${global.maxwarn}`, null, { mentions: [who] })
  }
}

handler.help = ['warn @user']
handler.tags = ['group']
handler.command = ['warn']
handler.desc = 'Warn a user (auto-kick at 3 warnings)'
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler
