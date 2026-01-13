/**
 * Admin Command: Kick
 * Remove a member from the group
 */
let handler = async (m, { conn, text, participants }) => {
  let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : false
  
  if (!who) return m.reply('*Tag or reply to the person you want to kick!*')
  
  // Check if user is trying to kick bot or owner
  if (who === conn.user.jid) return m.reply("*I can't kick myself!*")
  
  const ownerNumbers = global.owner.map(([num]) => num.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
  if (ownerNumbers.includes(who)) return m.reply("*I can't kick the bot owner!*")
  
  try {
    await conn.groupParticipantsUpdate(m.chat, [who], 'remove')
    m.reply(`✅ Successfully kicked @${who.split('@')[0]}`, null, { mentions: [who] })
  } catch (e) {
    m.reply(`❌ Failed to kick: ${e.message}`)
  }
}

handler.help = ['kick @user']
handler.tags = ['group']
handler.command = ['kick', 'remove']
handler.desc = 'Kick a member from the group'
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler
