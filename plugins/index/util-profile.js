/**
 * Utility Command: Profile/User Info
 * Get user profile information
 */
import { formatMessage } from '../../lib/simple.js'

let handler = async (m, { conn }) => {
  let who = m.quoted ? m.quoted.sender : m.mentionedJid?.[0] || m.sender
  
  try {
    let pp
    try {
      pp = await conn.profilePictureUrl(who, 'image')
    } catch {
      pp = 'https://i.imgur.com/8B4jwGq.jpeg'
    }
    
    const user = global.db.data.users[who] || {}
    const name = await conn.getName(who)
    
    const body = `📛 *Name:* ${name}
🆔 *JID:* ${who}
📱 *Number:* ${who.split('@')[0]}

📊 *Bot Stats:*
• Registered: ${user.registered ? '✅' : '❎'}
• Warnings: ${user.warn || 0}/${global.maxwarn || 3}
• Banned: ${user.banned ? '🚫 Yes' : '✅ No'}
• AFK: ${user.afk > -1 ? '💤 Yes' : '✅ No'}`

    const message = formatMessage('User Profile', body, 'Profile picture may not be available due to privacy settings')
    
    await conn.sendMessage(m.chat, {
      image: { url: pp },
      caption: message,
      mentions: [who]
    }, { quoted: m })
    
  } catch (e) {
    m.reply(`❌ Error: ${e.message}`)
  }
}

handler.help = ['profile [@user]', 'whois [@user]']
handler.tags = ['utility']
handler.command = ['profile', 'whois', 'userinfo', 'me']
handler.desc = 'Get user profile information'

export default handler
