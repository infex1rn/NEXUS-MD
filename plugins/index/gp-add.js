/**
 * Admin Command: Add
 * Add a member to the group
 */
let handler = async (m, { conn, text }) => {
  if (!text) return m.reply('*Please provide a phone number to add!*\nExample: `.add 1234567890`')
  
  let number = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
  
  try {
    // Check if number exists on WhatsApp
    const [result] = await conn.onWhatsApp(number)
    if (!result?.exists) return m.reply('*This number is not registered on WhatsApp!*')
    
    await conn.groupParticipantsUpdate(m.chat, [number], 'add')
    m.reply(`✅ Successfully added @${number.split('@')[0]}`, null, { mentions: [number] })
  } catch (e) {
    if (e.message.includes('not-authorized')) {
      m.reply('*User privacy settings prevent them from being added. An invite has been sent.*')
      await conn.sendMessage(number, {
        text: `You've been invited to join a WhatsApp group!\n\nGroup: ${(await conn.groupMetadata(m.chat)).subject}`
      })
    } else {
      m.reply(`❌ Failed to add: ${e.message}`)
    }
  }
}

handler.help = ['add <number>']
handler.tags = ['group']
handler.command = ['add']
handler.desc = 'Add a member to the group by phone number'
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler
