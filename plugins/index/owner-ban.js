/**
 * Owner Command: Ban User
 * Ban a user from using the bot
 */
let handler = async (m, { conn, text, command }) => {
  let who = m.quoted ? m.quoted.sender : m.mentionedJid?.[0] || (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : false)
  
  if (!who) throw '*Tag or reply to the user you want to ban/unban!*'
  
  let user = global.db.data.users[who]
  if (!user) global.db.data.users[who] = { banned: false }
  user = global.db.data.users[who]
  
  if (command === 'ban') {
    if (user.banned) throw '*User is already banned!*'
    user.banned = true
    m.reply(`🚫 *Banned* @${who.split('@')[0]} from using the bot`, null, { mentions: [who] })
  } else {
    if (!user.banned) throw '*User is not banned!*'
    user.banned = false
    m.reply(`✅ *Unbanned* @${who.split('@')[0]}`, null, { mentions: [who] })
  }
}

handler.help = ['ban @user', 'unban @user']
handler.tags = ['owner']
handler.command = ['ban', 'unban']
handler.desc = 'Ban or unban a user from using the bot'
handler.owner = true

export default handler
