/**
 * Group Command: Invite
 * Send group invite link to a user
 */
let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `*Please provide a phone number!*\n\nExample: *${usedPrefix}${command} 1234567890*`
  
  if (text.includes('+')) throw `*Enter number without "+"*`
  if (isNaN(text.replace(/\s/g, ''))) throw `*Enter only numbers!*`
  
  try {
    const link = 'https://chat.whatsapp.com/' + (await conn.groupInviteCode(m.chat))
    const number = text.replace(/\s/g, '') + '@s.whatsapp.net'
    
    await conn.sendMessage(number, {
      text: `📩 *GROUP INVITATION*\n\nYou've been invited to join a WhatsApp group!\n\n🔗 ${link}`
    })
    
    m.reply(`✅ *Invite sent to* ${text}`)
  } catch (e) {
    m.reply(`❌ Error: ${e.message}`)
  }
}

handler.help = ['invite <number>']
handler.tags = ['group']
handler.command = ['invite', 'invitar']
handler.desc = 'Send group invite link to a user via DM'
handler.group = true
handler.botAdmin = true

export default handler
