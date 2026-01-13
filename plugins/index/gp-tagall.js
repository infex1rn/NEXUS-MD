/**
 * Admin Command: Tag All
 * Tags all members in a group
 */
let handler = async (m, { conn, text, participants, groupMetadata }) => {
  let users = participants.map(u => u.id).filter(v => v !== conn.user.jid)
  m.reply(
    `▢ Group: *${groupMetadata.subject}*\n▢ Members: *${participants.length}*${text ? `\n▢ Message: ${text}\n` : ''}\n┌───⊷ *MEMBERS*\n` +
      users.map(v => '▢ @' + v.replace(/@.+/, '')).join`\n` +
      '\n└──✪ NEXUS-MD ✪──',
    null,
    { mentions: users }
  )
}

handler.help = ['tagall [message]']
handler.tags = ['group']
handler.command = ['tagall']
handler.desc = 'Tag all group members with an optional message'
handler.admin = true
handler.group = true

export default handler
