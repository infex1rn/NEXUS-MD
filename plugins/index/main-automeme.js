/**
 * Auto-Meme Background Task
 * Posts a meme to active groups every 2 hours
 */
import fetch from 'node-fetch'

const INTERVAL = 2 * 60 * 60 * 1000 // 2 hours

let handler = async (m, { conn }) => {
  // Manual trigger
  await postMeme(conn)
  m.reply('✅ Auto-Meme task triggered manually!')
}

handler.help = ['automeme']
handler.tags = ['owner']
handler.command = ['automeme', 'postmeme']
handler.owner = true

export default handler

// Initialize background task
if (!global.autoMemeStarted) {
  global.autoMemeStarted = true
  setInterval(async () => {
    try {
      // Need a way to get the connection. In this bot, it's usually global.conn
      if (global.conn) {
        await postMeme(global.conn)
      }
    } catch (e) {
      console.error('Error in Auto-Meme interval:', e)
    }
  }, INTERVAL)
}

async function postMeme(conn) {
  try {
    const res = await fetch('https://meme-api.com/gimme')
    const json = await res.json()
    if (!json.url) return

    const caption = `🤣 *RANDOM MEME* 🤣\n\n📌 *Title:* ${json.title}\n👤 *Author:* ${json.author}\n🌐 *Subreddit:* r/${json.subreddit}`

    // Find active groups
    const chats = global.db.data.chats
    const activeGroups = Object.keys(chats).filter(jid => jid.endsWith('@g.us') && chats[jid].active)

    console.log(`[Auto-Meme] Posting to ${activeGroups.length} active groups.`)

    for (const jid of activeGroups) {
      await conn.sendFile(jid, json.url, 'meme.jpg', caption).catch(e => console.error(`Failed to post meme to ${jid}:`, e))
    }
  } catch (e) {
    console.error('Error in postMeme:', e)
  }
}
