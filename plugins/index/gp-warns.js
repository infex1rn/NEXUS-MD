/**
 * Group Command: Check Warns
 * Check warnings of a user
 */
let handler = async (m, { conn, text }) => {
  let who = m.quoted ? m.quoted.sender : m.mentionedJid?.[0] || (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : m.sender)
  
  let user = global.db.data.users[who]
  if (!user) {
    global.db.data.users[who] = { warn: 0 }
    user = global.db.data.users[who]
  }
  
  const warnings = user.warn || 0
  const max = global.maxwarn || 3
  
  let message = `⚠️ *Warnings for* @${who.split('@')[0]}\n\n`
  message += `📊 *Count:* ${warnings}/${max}\n`
  message += `${'🟨'.repeat(warnings)}${'⬜'.repeat(max - warnings)}\n\n`
  
  if (warnings === 0) {
    message += `✅ No warnings! Keep it up!`
  } else if (warnings < max) {
    message += `⚠️ ${max - warnings} more warning(s) until kick.`
  } else {
    message += `🚫 Maximum warnings reached!`
  }
  
  await conn.sendMessage(m.chat, { text: message, mentions: [who] }, { quoted: m })
}

handler.help = ['warns [@user]', 'checkwarn [@user]']
handler.tags = ['group']
handler.command = ['warns', 'checkwarn', 'listwarn', 'warnlist']
handler.desc = 'Check warnings of a user'
handler.group = true

export default handler
