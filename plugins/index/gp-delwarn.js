/**
 * Group Command: Delete Warn
 * Remove warnings from a user
 */
let handler = async (m, { conn, text }) => {
  let who = m.quoted ? m.quoted.sender : m.mentionedJid?.[0] || (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : false)
  
  if (!who) throw '*Tag or reply to the user to clear warnings!*'
  
  let user = global.db.data.users[who]
  if (!user) throw '*User not found in database!*'
  
  if (!user.warn || user.warn === 0) {
    return m.reply(`✅ @${who.split('@')[0]} has no warnings.`, null, { mentions: [who] })
  }
  
  const prevWarn = user.warn
  user.warn = 0
  
  m.reply(`✅ Cleared ${prevWarn} warning(s) from @${who.split('@')[0]}`, null, { mentions: [who] })
}

handler.help = ['delwarn @user', 'clearwarn @user']
handler.tags = ['group']
handler.command = ['delwarn', 'clearwarn', 'unwarn', 'resetwarn']
handler.desc = 'Remove all warnings from a user'
handler.admin = true
handler.group = true

export default handler
