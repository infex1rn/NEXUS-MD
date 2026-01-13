/**
 * Media Command: YouTube Search
 * Search videos on YouTube
 */
import yts from 'yt-search'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `*Please provide a search query!*\n\nExample: *${usedPrefix}${command} funny videos*`
  
  await m.reply('🔍 *Searching YouTube...*')
  
  try {
    const { videos } = await yts(text)
    if (!videos || !videos.length) throw '*No results found!*'
    
    const results = videos.slice(0, 10)
    
    let message = `🔍 *YouTube Search Results*\n📝 Query: *${text}*\n\n`
    
    results.forEach((video, index) => {
      message += `*${index + 1}. ${video.title}*\n`
      message += `   ⏱️ ${video.timestamp} | 👁️ ${formatNumber(video.views)}\n`
      message += `   📺 ${video.author.name}\n`
      message += `   🔗 ${video.url}\n\n`
    })
    
    message += `_Use .play <song> to download audio_`
    
    await m.reply(message)
  } catch (e) {
    m.reply(`❌ Error: ${e.message || e}`)
  }
}

function formatNumber(num) {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num?.toString() || '0'
}

handler.help = ['yts <query>']
handler.tags = ['downloader']
handler.command = ['yts', 'ytsearch', 'youtube']
handler.desc = 'Search videos on YouTube'

export default handler
