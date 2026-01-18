/**
 * Group Command: Anti-ViewOnce
 * Toggle automatic View Once media capture
 */
let handler = async (m, { text, usedPrefix, command }) => {
  let chat = global.db.data.chats[m.chat]

  if (!text) {
    const status = chat.antiViewOnce ? 'ON ✅' : 'OFF ❌'
    return m.reply(`*Anti-ViewOnce Status:* ${status}\n\nUse \`${usedPrefix}${command} on\` or \`${usedPrefix}${command} off\` to toggle.`)
  }

  if (text.toLowerCase() === 'on') {
    chat.antiViewOnce = true
    m.reply('✅ *Anti-ViewOnce enabled!*\nView Once media will be automatically captured.')
  } else if (text.toLowerCase() === 'off') {
    chat.antiViewOnce = false
    m.reply('❌ *Anti-ViewOnce disabled!*')
  } else {
    m.reply(`*Usage:* \`${usedPrefix}${command} on/off\``)
  }
}

handler.help = ['antiviewonce on/off']
handler.tags = ['group']
handler.command = ['antiviewonce', 'antivo']
handler.admin = true
handler.group = true

export default handler
