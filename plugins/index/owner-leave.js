/**
 * Owner Command: Leave Group
 * Leave a group
 */
let handler = async (m, { conn }) => {
  try {
    await m.reply('👋 *Goodbye!*')
    await conn.groupLeave(m.chat)
  } catch (e) {
    m.reply(`❌ Error: ${e.message}`)
  }
}

handler.help = ['leave']
handler.tags = ['owner']
handler.command = ['leave', 'leavegroup']
handler.desc = 'Leave the current group'
handler.owner = true
handler.group = true

export default handler
