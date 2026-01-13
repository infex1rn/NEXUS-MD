/**
 * Tools Command: Short URL
 * Shorten a URL
 */
import fetch from 'node-fetch'

let handler = async (m, { text, usedPrefix, command }) => {
  if (!text) throw `*Please provide a URL to shorten!*\n\nExample: *${usedPrefix}${command} https://example.com/very-long-url*`
  
  if (!/^https?:\/\//i.test(text)) {
    text = 'https://' + text
  }
  
  try {
    await m.reply('🔗 *Shortening URL...* Please wait.')
    
    // Using is.gd API (free, no auth)
    const response = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(text)}`)
    const data = await response.json()
    
    if (data.shorturl) {
      m.reply(`🔗 *URL Shortened*\n\n📎 Original: ${text}\n✂️ Short: ${data.shorturl}`)
    } else {
      throw new Error(data.errormessage || 'Failed to shorten URL')
    }
    
  } catch (e) {
    m.reply(`❌ Error: ${e.message}`)
  }
}

handler.help = ['short <url>', 'shorten <url>']
handler.tags = ['tools']
handler.command = ['short', 'shorten', 'shorturl', 'tiny']
handler.desc = 'Shorten a URL'

export default handler
