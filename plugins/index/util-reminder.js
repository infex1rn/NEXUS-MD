/**
 * Utility Command: Reminder
 * Set a reminder (persistent via database)
 */

// Helper to get reminders from database
function getReminders() {
  if (!global.db.data.reminders) {
    global.db.data.reminders = {}
  }
  return global.db.data.reminders
}

// Check and fire pending reminders on startup
async function checkPendingReminders(conn) {
  const reminders = getReminders()
  const now = Date.now()
  
  for (const [sender, userReminders] of Object.entries(reminders)) {
    if (!Array.isArray(userReminders)) continue
    
    for (const reminder of userReminders) {
      if (reminder.endTime <= now && !reminder.fired) {
        // Fire overdue reminder
        try {
          await conn.sendMessage(reminder.chat, {
            text: `⏰ *REMINDER* (delayed)\n\n@${sender.split('@')[0]}, you asked me to remind you:\n\n📝 ${reminder.message}`,
            mentions: [sender]
          })
          reminder.fired = true
        } catch (e) {
          console.error('Reminder error:', e)
        }
      }
    }
    
    // Clean up fired reminders
    reminders[sender] = userReminders.filter(r => !r.fired && r.endTime > now)
    if (reminders[sender].length === 0) {
      delete reminders[sender]
    }
  }
}

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
  const reminders = getReminders()
  
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
    const endTime = Date.now() + ms
    
    // Store reminder in database
    if (!reminders[m.sender]) reminders[m.sender] = []
    reminders[m.sender].push({ 
      id: reminderId, 
      message, 
      endTime, 
      chat: m.chat,
      fired: false,
      createdAt: Date.now()
    })
    
    // Set timeout for this session (will also be checked on restart)
    setTimeout(async () => {
      try {
        const currentReminders = getReminders()
        const userReminders = currentReminders[m.sender] || []
        const reminder = userReminders.find(r => r.id === reminderId)
        
        if (reminder && !reminder.fired) {
          await conn.sendMessage(m.chat, {
            text: `⏰ *REMINDER*\n\n@${m.sender.split('@')[0]}, you asked me to remind you:\n\n📝 ${message}`,
            mentions: [m.sender]
          })
          
          // Mark as fired and clean up
          reminder.fired = true
          currentReminders[m.sender] = userReminders.filter(r => r.id !== reminderId)
          if (currentReminders[m.sender].length === 0) {
            delete currentReminders[m.sender]
          }
        }
      } catch (e) {
        console.error('Reminder error:', e)
      }
    }, ms)
    
    m.reply(`✅ *Reminder set!*\n\n⏰ I'll remind you in ${timeArg}\n📝 Message: ${message}`)
    
  } else if (command === 'reminders') {
    const userReminders = reminders[m.sender] || []
    const activeReminders = userReminders.filter(r => !r.fired && r.endTime > Date.now())
    
    if (activeReminders.length === 0) {
      return m.reply('*You have no active reminders!*')
    }
    
    let message = `⏰ *Your Reminders*\n\n`
    activeReminders.forEach((r, i) => {
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
