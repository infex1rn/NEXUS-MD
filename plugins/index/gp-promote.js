/**
 * Admin Command: Promote
 * Promote a member to admin
 */
let handler = async (m, { conn, text }) => {
  let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : false
  
  if (!who) return m.reply('*Tag or reply to the person you want to promote!*')
  
  try {
    await conn.groupParticipantsUpdate(m.chat, [who], 'promote')
    m.reply(`✅ @${who.split('@')[0]} has been promoted to admin! 👑`, null, { mentions: [who] })
  } catch (e) {
    m.reply(`❌ Failed to promote: ${e.message}`)
  }
}

handler.help = ['promote @user']
handler.tags = ['group']
handler.command = ['promote']
handler.desc = 'Promote a member to group admin'
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler
