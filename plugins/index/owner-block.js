/**
 * Owner Command: Block/Unblock
 * Block or unblock a user
 */
let handler = async (m, { conn, text, command }) => {
  let who = m.quoted ? m.quoted.sender : m.mentionedJid?.[0] || (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : false)
  
  if (!who) throw '*Tag or reply to the user you want to block/unblock!*'
  
  try {
    if (command === 'block') {
      await conn.updateBlockStatus(who, 'block')
      m.reply(`✅ *Blocked* @${who.split('@')[0]}`, null, { mentions: [who] })
    } else {
      await conn.updateBlockStatus(who, 'unblock')
      m.reply(`✅ *Unblocked* @${who.split('@')[0]}`, null, { mentions: [who] })
    }
  } catch (e) {
    m.reply(`❌ Error: ${e.message}`)
  }
}

handler.help = ['block @user', 'unblock @user']
handler.tags = ['owner']
handler.command = ['block', 'unblock']
handler.desc = 'Block or unblock a user'
handler.owner = true

export default handler
