/**
 * Group Command: Revoke Link
 * Reset group invite link
 */
let handler = async (m, { conn }) => {
  try {
    await conn.groupRevokeInvite(m.chat)
    const code = await conn.groupInviteCode(m.chat)
    const link = `https://chat.whatsapp.com/${code}`
    
    m.reply(`✅ *Group link has been reset!*\n\n🔗 New link: ${link}`)
  } catch (e) {
    m.reply(`❌ Error: ${e.message}`)
  }
}

handler.help = ['revoke', 'resetlink']
handler.tags = ['group']
handler.command = ['revoke', 'resetlink', 'revokelink']
handler.desc = 'Reset group invite link'
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
