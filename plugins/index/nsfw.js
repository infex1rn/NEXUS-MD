/**
 * NSFW Command: Anime NSFW Images
 * Fetch NSFW images from public APIs
 */
import fetch from 'node-fetch'
import { createProgressBar } from '../../lib/progress.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  // Check if NSFW is enabled for the chat
  const chat = global.db.data.chats[m.chat]
  if (chat && !chat.nsfw && !m.fromMe) {
    throw `🔞 *NSFW is disabled in this group!*\n\nUse *${usedPrefix}enable nsfw* to enable it (Admins only).`
  }

  const type = command === 'nsfw' ? (text || 'waifu') : command
  const pb = createProgressBar(conn, m, { title: 'NSFW Content', successMsg: 'Enjoy!' })

  try {
    await pb.update(20, 'Fetching from database...')
    await m.react('🔞')

    // Using waifu.pics API
    const response = await fetch(`https://api.waifu.pics/nsfw/${type}`)
    if (!response.ok) throw new Error('API returned an error')

    const json = await response.json()
    if (!json.url) throw new Error('No image found')

    await pb.update(70, 'Downloading content...')
    await pb.update(90, 'Applying filters...')

    await conn.sendFile(m.chat, json.url, 'nsfw.jpg', `🔥 *Category:* ${type}`, m)
    await pb.finish(true)
  } catch (e) {
    await m.react('❌')
    console.error(e)
    await pb.finish(false, 'Category not found or API down. Try: waifu, neko, trap, blowjob')
  }
}

handler.help = ['waifu', 'neko', 'trap', 'blowjob']
handler.tags = ['nsfw']
handler.command = ['nsfw', 'waifu', 'neko', 'trap', 'blowjob', 'hentai']
handler.desc = 'Fetch NSFW anime images'
handler.group = true

export default handler
