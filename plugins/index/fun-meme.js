/**
 * Fun Command: Meme
 * Get a random meme
 */
import fetch from 'node-fetch'

let handler = async (m, { conn }) => {
  try {
    await m.reply('😂 *Getting meme...* Please wait.')
    
    // Using meme-api.com (free, no auth)
    const response = await fetch('https://meme-api.com/gimme')
    const data = await response.json()
    
    if (data.url) {
      await conn.sendMessage(m.chat, {
        image: { url: data.url },
        caption: `😂 *${data.title}*\n\n📌 r/${data.subreddit}\n👍 ${data.ups} upvotes`
      }, { quoted: m })
    } else {
      throw new Error('No meme found')
    }
    
  } catch (e) {
    // Fallback: Send a text response
    const memeTexts = [
      "When the code works but you don't know why 🤷‍♂️",
      "Me explaining to my mom that I'm not playing, I'm 'working' 💻",
      "Developers at 3am: 'just one more bug fix' 🌙",
      "When you fix one bug and create 10 more 🐛",
      "Stackoverflow copy-paste developer checking in ✅"
    ]
    m.reply(`😂 *Random Meme*\n\n${memeTexts[Math.floor(Math.random() * memeTexts.length)]}`)
  }
}

handler.help = ['meme']
handler.tags = ['fun']
handler.command = ['meme', 'memes']
handler.desc = 'Get a random meme from Reddit'

export default handler
