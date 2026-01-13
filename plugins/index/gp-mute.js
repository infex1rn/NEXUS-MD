/**
 * Admin Command: Mute/Unmute
 * Lock or unlock group chat
 */
let handler = async (m, { conn, command }) => {
  try {
    if (command === 'mute' || command === 'close') {
      await conn.groupSettingUpdate(m.chat, 'announcement')
      m.reply('🔒 *Group is now closed!*\nOnly admins can send messages.')
    } else {
      await conn.groupSettingUpdate(m.chat, 'not_announcement')
      m.reply('🔓 *Group is now open!*\nAll participants can send messages.')
    }
  } catch (e) {
    m.reply(`❌ Failed: ${e.message}`)
  }
}

handler.help = ['mute', 'unmute']
handler.tags = ['group']
handler.command = ['mute', 'unmute', 'close', 'open']
handler.desc = 'Mute/unmute the group (only admins can send)'
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler
