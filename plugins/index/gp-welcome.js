/**
 * Admin Command: Welcome
 * Set welcome messages for new members
 */
let handler = async (m, { conn, text, command }) => {
  let chat = global.db.data.chats[m.chat]
  
  if (command === 'welcome') {
    if (!text) {
      const status = chat.welcome ? 'ON ✅' : 'OFF ❌'
      return m.reply(`*Welcome Messages:* ${status}\n\nUse \`.welcome on\` or \`.welcome off\` to toggle.\nUse \`.setwelcome <message>\` to set custom message.\n\n*Placeholders:*\n- @user = mentioned user\n- @group = group name\n- @desc = group description`)
    }
    
    if (text.toLowerCase() === 'on') {
      chat.welcome = true
      m.reply('✅ *Welcome messages enabled!*')
    } else if (text.toLowerCase() === 'off') {
      chat.welcome = false
      m.reply('❌ *Welcome messages disabled!*')
    } else {
      m.reply('*Usage:* `.welcome on` or `.welcome off`')
    }
  } else if (command === 'setwelcome') {
    if (!text) return m.reply('*Please provide a welcome message!*\n\nExample: `.setwelcome Welcome @user to @group!`')
    chat.sWelcome = text
    m.reply(`✅ *Welcome message set:*\n\n${text}`)
  } else if (command === 'setbye' || command === 'setgoodbye') {
    if (!text) return m.reply('*Please provide a goodbye message!*\n\nExample: `.setbye Goodbye @user!`')
    chat.sBye = text
    m.reply(`✅ *Goodbye message set:*\n\n${text}`)
  }
}

handler.help = ['welcome on/off', 'setwelcome <message>', 'setbye <message>']
handler.tags = ['group']
handler.command = ['welcome', 'setwelcome', 'setbye', 'setgoodbye']
handler.desc = 'Configure welcome/goodbye messages'
handler.admin = true
handler.group = true

export default handler
