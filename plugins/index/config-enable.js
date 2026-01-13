/**
 * Enable/Disable Command
 * Toggle various bot features
 */
let handler = async (m, { conn, usedPrefix, command, args, isOwner, isAdmin }) => {
  let type = (args[0] || '').toLowerCase()
  let state = (args[1] || '').toLowerCase()
  
  if (/^(on|off)$/i.test(command)) {
    state = command.toLowerCase()
    type = (args[0] || '').toLowerCase()
  }
  
  let isEnable = /true|enable|on|1/i.test(state)
  let chat = global.db.data.chats[m.chat]
  let bot = global.db.data.settings[conn.user.jid] || {}
  
  if (!type) {
    return m.reply(`
*Usage:*
  ${usedPrefix}enable <option> on/off
  ${usedPrefix}on <option>
  ${usedPrefix}off <option>

*Examples:*
  ${usedPrefix}enable welcome on
  ${usedPrefix}on antilink
  ${usedPrefix}off detect

*Available Options:*
  • welcome - Welcome/goodbye messages
  • antilink - Auto-delete links
  • detect - Detect group changes
  • autosticker - Auto sticker from images
  • antispam - Anti-spam protection
  • antidelete - Show deleted messages
  • chatbot - AI auto-reply
  • nsfw - NSFW content (admin only)
`.trim())
  }
  
  let isAll = false
  
  switch (type) {
    case 'welcome':
      if (!m.isGroup) {
        if (!isOwner) throw '*This command is for groups only!*'
      } else if (!isAdmin) throw '*Admin only!*'
      chat.welcome = isEnable
      break
      
    case 'detect':
    case 'detector':
      if (!m.isGroup) {
        if (!isOwner) throw '*This command is for groups only!*'
      } else if (!isAdmin) throw '*Admin only!*'
      chat.detect = isEnable
      break
      
    case 'autosticker':
      if (m.isGroup && !(isAdmin || isOwner)) throw '*Admin only!*'
      chat.autosticker = isEnable
      break
      
    case 'antispam':
      if (m.isGroup && !(isAdmin || isOwner)) throw '*Admin only!*'
      chat.antiSpam = isEnable
      break
      
    case 'antidelete':
    case 'delete':
      if (m.isGroup && !(isAdmin || isOwner)) throw '*Admin only!*'
      chat.antiDelete = isEnable
      break
      
    case 'antilink':
      if (m.isGroup && !(isAdmin || isOwner)) throw '*Admin only!*'
      chat.antiLink = isEnable
      break
      
    case 'nsfw':
      if (m.isGroup && !(isAdmin || isOwner)) throw '*Admin only!*'
      chat.nsfw = isEnable
      break
      
    case 'chatbot':
      if (m.isGroup && !(isAdmin || isOwner)) throw '*Admin only!*'
      chat.chatbot = isEnable
      break
      
    case 'restrict':
      isAll = true
      if (!isOwner) throw '*Owner only!*'
      bot.restrict = isEnable
      break
      
    case 'anticall':
      isAll = true
      if (!isOwner) throw '*Owner only!*'
      bot.antiCall = isEnable
      break
      
    default:
      return m.reply(`*Unknown option:* ${type}\n\nUse *${usedPrefix}enable* to see available options.`)
  }
  
  m.reply(`✅ *${type}* is now *${isEnable ? 'ON' : 'OFF'}*${isAll ? ' for the bot' : ''}`)
}

handler.help = ['enable <option> on/off', 'on <option>', 'off <option>']
handler.tags = ['config']
handler.command = /^((en|dis)able|(turn)?o(n|ff))$/i
handler.desc = 'Enable or disable various bot features'

export default handler
