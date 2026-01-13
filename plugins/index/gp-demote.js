/**
 * Admin Command: Demote
 * Demote an admin to regular member
 */
let handler = async (m, { conn, text }) => {
  let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : false
  
  if (!who) return m.reply('*Tag or reply to the admin you want to demote!*')
  
  try {
    await conn.groupParticipantsUpdate(m.chat, [who], 'demote')
    m.reply(`✅ @${who.split('@')[0]} has been demoted from admin.`, null, { mentions: [who] })
  } catch (e) {
    m.reply(`❌ Failed to demote: ${e.message}`)
  }
}

handler.help = ['demote @user']
handler.tags = ['group']
handler.command = ['demote']
handler.desc = 'Demote an admin to regular member'
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler
