/**
 * Owner Command: Join Group
 * Join a group via invite link
 */
let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `*Please provide a group invite link!*\n\nExample: *${usedPrefix}${command} https://chat.whatsapp.com/ABC123*`
  
  const linkMatch = text.match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/i)
  if (!linkMatch) throw '*Invalid group link!*'
  
  const code = linkMatch[1]
  
  try {
    await m.reply('🔗 *Joining group...*')
    const res = await conn.groupAcceptInvite(code)
    m.reply(`✅ *Successfully joined group!*\n\nGroup ID: ${res}`)
  } catch (e) {
    m.reply(`❌ Error joining group: ${e.message}`)
  }
}

handler.help = ['join <link>']
handler.tags = ['owner']
handler.command = ['join', 'joingroup']
handler.desc = 'Join a group via invite link'
handler.owner = true

export default handler
