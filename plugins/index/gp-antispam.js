/**
 * Group Command: Anti-Spam
 * Toggle anti-spam protection
 */
let handler = async (m, { conn, text, usedPrefix, command }) => {
  let chat = global.db.data.chats[m.chat]

  if (!text) {
    const status = chat.antiSpam ? 'ON ✅' : 'OFF ❌'
    return m.reply(`*Anti-Spam Status:* ${status}\n\nUse \`${usedPrefix}${command} on\` or \`${usedPrefix}${command} off\` to toggle.`)
  }

  if (text.toLowerCase() === 'on') {
    chat.antiSpam = true
    m.reply('✅ *Anti-Spam enabled!*\nUsers who spam messages will be warned/kicked.')
  } else if (text.toLowerCase() === 'off') {
    chat.antiSpam = false
    m.reply('❌ *Anti-Spam disabled!*')
  } else {
    m.reply(`*Usage:* \`${usedPrefix}${command} on/off\``)
  }
}

handler.help = ['antispam on/off']
handler.tags = ['group']
handler.command = ['antispam']
handler.admin = true
handler.group = true

export default handler
