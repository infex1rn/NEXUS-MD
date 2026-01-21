/**
 * Main Command: Owner
 * Display bot owner information
 */
import { formatMessage } from '../../lib/simple.js'

let handler = async (m, { conn, command }) => {
  if (command === 'mods' || command === 'modlist') {
    const mods = global.mods || []
    if (mods.length === 0) return m.reply('*No moderators configured!*')
    let body = '🛠️ *MODERATOR LIST*\n\n'
    mods.forEach((mod, i) => {
      body += `${i + 1}. wa.me/${mod.split('@')[0]}\n`
    })
    return m.reply(body, null, { mentions: mods })
  }

  const owners = global.owner || []
  
  if (owners.length === 0) {
    return m.reply('*No owners configured!*')
  }
  
  let body = ''
  for (const owner of owners) {
    const number = owner.split('@')[0]
    body += `📱 *Owner*\nwa.me/${number}\n\n`
  }
  
  let message = formatMessage('Bot Owners', body.trim(), 'Contact the owner for queries or support!')
  
  // Send owner contact(s)
  const contacts = owners.map(owner => [owner.split('@')[0], 'Bot Owner'])
  
  await conn.sendContact(m.chat, contacts, m)
  await m.reply(message)
}

handler.help = ['owner', 'mods']
handler.tags = ['main']
handler.command = ['owner', 'creator', 'dev', 'mods', 'modlist']
handler.desc = 'Display bot owner information'

export default handler
