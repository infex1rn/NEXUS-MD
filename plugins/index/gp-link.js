/**
 * Group Command: Get Link
 * Get the group invite link
 */
let handler = async (m, { conn }) => {
  try {
    const code = await conn.groupInviteCode(m.chat)
    const link = `https://chat.whatsapp.com/${code}`
    
    m.reply(`🔗 *Group Invite Link*\n\n${link}`)
  } catch (e) {
    m.reply(`❌ Error: ${e.message}`)
  }
}

handler.help = ['link', 'getlink']
handler.tags = ['group']
handler.command = ['link', 'getlink', 'grouplink', 'gclink']
handler.desc = 'Get group invite link'
handler.group = true
handler.botAdmin = true

export default handler
