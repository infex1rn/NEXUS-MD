/**
 * Main Command: Owner
 * Display bot owner information
 */
import { formatMessage } from '../../lib/simple.js'

let handler = async (m, { conn }) => {
  const owners = global.owner || []
  
  if (owners.length === 0) {
    return m.reply('*No owners configured!*')
  }
  
  let body = ''
  for (const [number, name] of owners) {
    body += `📱 *${name || 'Owner'}*\nwa.me/${number}\n\n`
  }
  
  let message = formatMessage('Bot Owners', body.trim(), 'Contact the owner for queries or support!')
  
  // Send owner contact(s)
  const contacts = owners.map(([number, name]) => [number, name || 'Bot Owner'])
  
  await conn.sendContact(m.chat, contacts, m)
  await m.reply(message)
}

handler.help = ['owner']
handler.tags = ['main']
handler.command = ['owner', 'creator', 'dev']
handler.desc = 'Display bot owner information'

export default handler
