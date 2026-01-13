/**
 * Utility Command: AFK
 * Set your status as away
 */
let handler = async (m, { conn, text }) => {
  let user = global.db.data.users[m.sender]
  user.afk = Date.now()
  user.afkReason = text || 'No reason'
  
  m.reply(`✅ *You are now AFK*\n\n📝 Reason: ${text || 'No reason'}\n\n_Others will be notified when they mention you._`)
}

handler.before = async (m, { conn }) => {
  // Check if mentioned users are AFK
  for (const jid of m.mentionedJid || []) {
    const user = global.db.data.users[jid]
    if (!user || user.afk < 0) continue
    
    const afkTime = Date.now() - user.afk
    const username = jid.split('@')[0]
    
    await m.reply(
      `⚠️ *@${username} is AFK*\n\n📝 Reason: ${user.afkReason || 'No reason'}\n⏱️ Since: ${formatDuration(afkTime)} ago`,
      null,
      { mentions: [jid] }
    )
  }
  
  // Check if sender is AFK and typing
  const user = global.db.data.users[m.sender]
  if (user?.afk > -1) {
    const afkTime = Date.now() - user.afk
    user.afk = -1
    user.afkReason = ''
    
    await m.reply(
      `✅ *Welcome back @${m.sender.split('@')[0]}!*\n\nYou were AFK for ${formatDuration(afkTime)}`,
      null,
      { mentions: [m.sender] }
    )
  }
  
  return false
}

function formatDuration(ms) {
  const seconds = Math.floor((ms / 1000) % 60)
  const minutes = Math.floor((ms / (60 * 1000)) % 60)
  const hours = Math.floor((ms / (60 * 60 * 1000)) % 24)
  const days = Math.floor(ms / (24 * 60 * 60 * 1000))
  
  let result = []
  if (days > 0) result.push(`${days}d`)
  if (hours > 0) result.push(`${hours}h`)
  if (minutes > 0) result.push(`${minutes}m`)
  if (seconds > 0) result.push(`${seconds}s`)
  
  return result.join(' ') || '0s'
}

handler.help = ['afk [reason]']
handler.tags = ['utility']
handler.command = ['afk', 'brb']
handler.desc = 'Set your status as away from keyboard'

export default handler
