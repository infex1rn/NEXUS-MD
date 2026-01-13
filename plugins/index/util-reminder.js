/**
 * Utility Command: Reminder
 * Set a reminder
 */
const reminders = {}

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
  if (command === 'remind') {
    if (!text) {
      throw `*Please provide time and message!*\n\nUsage: *${usedPrefix}${command} <time> <message>*\n\nExamples:\n• *${usedPrefix}remind 5m Take a break*\n• *${usedPrefix}remind 1h Meeting time*\n• *${usedPrefix}remind 30s Quick reminder*\n\nTime formats: s (seconds), m (minutes), h (hours)`
    }
    
    const timeArg = args[0]
    const message = args.slice(1).join(' ') || 'Reminder!'
    
    // Parse time
    const match = timeArg.match(/^(\d+)(s|m|h)$/i)
    if (!match) {
      throw '*Invalid time format!*\n\nUse: 30s, 5m, 1h, etc.'
    }
    
    const value = parseInt(match[1])
    const unit = match[2].toLowerCase()
    
    let ms
    switch (unit) {
      case 's': ms = value * 1000; break
      case 'm': ms = value * 60 * 1000; break
      case 'h': ms = value * 60 * 60 * 1000; break
    }
    
    if (ms > 24 * 60 * 60 * 1000) {
      throw '*Maximum reminder time is 24 hours!*'
    }
    
    const reminderId = Date.now()
    const endTime = new Date(Date.now() + ms)
    
    // Store reminder
    if (!reminders[m.sender]) reminders[m.sender] = []
    reminders[m.sender].push({ id: reminderId, message, endTime, chat: m.chat })
    
    // Set timeout
    setTimeout(async () => {
      try {
        await conn.sendMessage(m.chat, {
          text: `⏰ *REMINDER*\n\n@${m.sender.split('@')[0]}, you asked me to remind you:\n\n📝 ${message}`,
          mentions: [m.sender]
        })
        
        // Remove from list
        if (reminders[m.sender]) {
          reminders[m.sender] = reminders[m.sender].filter(r => r.id !== reminderId)
        }
      } catch (e) {
        console.error('Reminder error:', e)
      }
    }, ms)
    
    m.reply(`✅ *Reminder set!*\n\n⏰ I'll remind you in ${timeArg}\n📝 Message: ${message}`)
    
  } else if (command === 'reminders') {
    const userReminders = reminders[m.sender] || []
    
    if (userReminders.length === 0) {
      return m.reply('*You have no active reminders!*')
    }
    
    let message = `⏰ *Your Reminders*\n\n`
    userReminders.forEach((r, i) => {
      const timeLeft = Math.max(0, r.endTime - Date.now())
      const mins = Math.floor(timeLeft / 60000)
      const secs = Math.floor((timeLeft % 60000) / 1000)
      message += `${i + 1}. ${r.message}\n   ⏱️ ${mins}m ${secs}s left\n\n`
    })
    
    m.reply(message)
  }
}

handler.help = ['remind <time> <message>', 'reminders']
handler.tags = ['utility']
handler.command = ['remind', 'reminder', 'reminders', 'remindme']
handler.desc = 'Set a reminder for yourself'

export default handler
