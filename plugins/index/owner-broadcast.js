/**
 * Owner Command: Broadcast
 * Send message to all chats
 */
let handler = async (m, { conn, text }) => {
  if (!text && !m.quoted) throw '*Please provide a message to broadcast!*'
  
  let chats = Object.entries(conn.chats)
    .filter(([_, chat]) => chat.isChats)
    .map(v => v[0])
  
  const message = text || (m.quoted ? m.quoted.text : '')
  
  if (!message) throw '*No message to broadcast!*'
  
  await m.reply(`📢 *Broadcasting to ${chats.length} chats...*`)
  
  let success = 0
  let failed = 0
  
  for (let id of chats) {
    try {
      await conn.sendMessage(id, {
        text: `📢 *BROADCAST*\n\n${message}\n\n_— ${global.botname || 'NEXUS-MD'}_`
      })
      success++
    } catch (e) {
      failed++
    }
  }
  
  m.reply(`✅ *Broadcast Complete!*\n\n📤 Sent: ${success}\n❌ Failed: ${failed}`)
}

handler.help = ['broadcast <message>', 'bc <message>']
handler.tags = ['owner']
handler.command = ['broadcast', 'bc']
handler.desc = 'Broadcast a message to all chats'
handler.owner = true

export default handler
