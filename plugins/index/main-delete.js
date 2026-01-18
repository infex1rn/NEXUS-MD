/**
 * Main Command: Delete
 * Deletes the quoted message
 */
let handler = async (m, { conn, isBotAdmin, isOwner }) => {
  if (!m.quoted) throw '*Reply to a message you want to delete!*'

  const botJid = conn.decodeJid(conn.user.id)
  const isQuotedFromMe = m.quoted.fromMe || areJidsSameUser(m.quoted.sender, botJid)

  if (m.isGroup) {
    if (!isQuotedFromMe && !isBotAdmin) {
      throw '*I need to be admin to delete other people\'s messages!*'
    }
  } else {
    if (!isQuotedFromMe) {
      throw '*I can only delete my own messages in DMs!*'
    }
  }

  await conn.sendMessage(m.chat, { delete: m.quoted.vM ? m.quoted.vM.key : m.quoted.key })
}

handler.help = ['delete', 'del']
handler.tags = ['main']
handler.command = ['delete', 'del']
handler.desc = 'Delete a quoted message'

export default handler

function areJidsSameUser(jid1, jid2) {
  if (!jid1 || !jid2) return false
  return jid1.split('@')[0] === jid2.split('@')[0]
}
