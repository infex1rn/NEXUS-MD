/**
 * Main Command: Owner
 * Display bot owner information
 */
let handler = async (m, { conn }) => {
  const owners = global.owner || []
  
  if (owners.length === 0) {
    return m.reply('*No owners configured!*')
  }
  
  let message = `👑 *NEXUS-MD BOT OWNERS*\n\n`
  
  for (const [number, name] of owners) {
    const jid = number.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    message += `📱 *${name || 'Owner'}*\nwa.me/${number}\n\n`
  }
  
  message += `_Contact the owner for queries or support!_`
  
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
