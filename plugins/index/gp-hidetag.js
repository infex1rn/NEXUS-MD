/**
 * Admin Command: Hide Tag
 * Tags all members invisibly
 */
let handler = async (m, { conn, text, participants, groupMetadata }) => {
  let users = participants.map(u => u.id).filter(v => v !== conn.user.jid)
  await conn.sendMessage(m.chat, {
    text: text || '📢 *Attention everyone!*',
    mentions: users
  }, { quoted: m })
}

handler.help = ['hidetag [message]']
handler.tags = ['group']
handler.command = ['hidetag', 'htag']
handler.desc = 'Tag all members without showing their names'
handler.admin = true
handler.group = true

export default handler
