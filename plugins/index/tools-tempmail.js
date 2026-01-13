/**
 * Tools Command: Temp Mail
 * Generate temporary email address
 */
import fetch from 'node-fetch'

// Store temporary emails
const tempMails = {}

let handler = async (m, { conn, text, command, usedPrefix }) => {
  const userId = m.sender
  
  try {
    if (command === 'tempmail') {
      await m.reply('📧 *Generating temporary email...*')
      
      // Using 1secmail API (free, no auth needed)
      const domains = ['1secmail.com', '1secmail.org', '1secmail.net']
      const domain = domains[Math.floor(Math.random() * domains.length)]
      const randomName = Math.random().toString(36).substring(2, 10)
      const email = `${randomName}@${domain}`
      
      // Store for user
      tempMails[userId] = { email, domain, name: randomName }
      
      const response = `📧 *Temporary Email Generated*\n\n✉️ Email: *${email}*\n\n_This email is valid for 10 minutes._\n\n*Commands:*\n- *${usedPrefix}inbox* - Check inbox\n- *${usedPrefix}tempmail* - Generate new email`
      
      await m.reply(response)
      
    } else if (command === 'inbox') {
      if (!tempMails[userId]) {
        throw `*No temporary email found!*\nUse *${usedPrefix}tempmail* to generate one.`
      }
      
      const { email, domain, name } = tempMails[userId]
      
      await m.reply('📬 *Checking inbox...*')
      
      const response = await fetch(`https://www.1secmail.com/api/v1/?action=getMessages&login=${name}&domain=${domain}`)
      const messages = await response.json()
      
      if (!messages || messages.length === 0) {
        m.reply(`📭 *Inbox is empty*\n\n✉️ Email: ${email}\n\n_Check back later for new messages._`)
      } else {
        let inboxText = `📬 *Inbox for ${email}*\n\n`
        
        for (let msg of messages.slice(0, 5)) {
          inboxText += `━━━━━━━━━━━━━━━\n`
          inboxText += `📧 *From:* ${msg.from}\n`
          inboxText += `📋 *Subject:* ${msg.subject}\n`
          inboxText += `📅 *Date:* ${msg.date}\n`
        }
        
        m.reply(inboxText)
      }
    }
    
  } catch (e) {
    m.reply(`❌ Error: ${e.message || e}`)
  }
}

handler.help = ['tempmail', 'inbox']
handler.tags = ['tools']
handler.command = ['tempmail', 'inbox', 'checkmail']
handler.desc = 'Generate temporary email and check inbox'

export default handler
