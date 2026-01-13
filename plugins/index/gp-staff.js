/**
 * Group Command: Staff List
 * List all group admins
 */
let handler = async (m, { conn, participants, groupMetadata }) => {
  const groupAdmins = participants.filter(p => p.admin)
  
  if (groupAdmins.length === 0) {
    return m.reply('*No admins found in this group!*')
  }
  
  const owner = groupMetadata.owner || groupAdmins.find(p => p.admin === 'superadmin')?.id
  const superAdmins = groupAdmins.filter(p => p.admin === 'superadmin')
  const admins = groupAdmins.filter(p => p.admin === 'admin')
  
  let message = `👥 *GROUP STAFF*\n\n`
  message += `📋 Group: ${groupMetadata.subject}\n\n`
  
  if (owner) {
    message += `👑 *Owner:*\n@${owner.split('@')[0]}\n\n`
  }
  
  if (superAdmins.length > 0) {
    message += `⭐ *Super Admins (${superAdmins.length}):*\n`
    superAdmins.forEach((admin, i) => {
      message += `${i + 1}. @${admin.id.split('@')[0]}\n`
    })
    message += '\n'
  }
  
  if (admins.length > 0) {
    message += `🛡️ *Admins (${admins.length}):*\n`
    admins.forEach((admin, i) => {
      message += `${i + 1}. @${admin.id.split('@')[0]}\n`
    })
  }
  
  await conn.sendMessage(m.chat, {
    text: message,
    mentions: groupAdmins.map(a => a.id)
  }, { quoted: m })
}

handler.help = ['staff', 'admins', 'listadmin']
handler.tags = ['group']
handler.command = ['staff', 'admins', 'listadmin', 'adminlist']
handler.desc = 'List all group admins'
handler.group = true

export default handler
