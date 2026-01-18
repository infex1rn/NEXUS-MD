/**
 * Group Command: Auto-Sticker
 * Toggle automatic sticker conversion for images
 */
let handler = async (m, { conn, text, usedPrefix, command }) => {
  let chat = global.db.data.chats[m.chat]

  if (!text) {
    const status = chat.autoSticker ? 'ON ✅' : 'OFF ❌'
    return m.reply(`*Auto-Sticker Status:* ${status}\n\nUse \`${usedPrefix}${command} on\` or \`${usedPrefix}${command} off\` to toggle.`)
  }

  if (text.toLowerCase() === 'on') {
    chat.autoSticker = true
    m.reply('✅ *Auto-Sticker enabled!*\nImages sent in this chat will be automatically converted to stickers.')
  } else if (text.toLowerCase() === 'off') {
    chat.autoSticker = false
    m.reply('❌ *Auto-Sticker disabled!*')
  } else {
    m.reply(`*Usage:* \`${usedPrefix}${command} on/off\``)
  }
}

handler.help = ['autosticker on/off']
handler.tags = ['group']
handler.command = ['autosticker']
handler.admin = true
handler.group = true

export default handler
