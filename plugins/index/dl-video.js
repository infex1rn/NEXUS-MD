/**
 * Media Command: Video
 * Download videos from YouTube/TikTok
 */
import fetch from 'node-fetch'
import yts from 'yt-search'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `*Please provide a video name or URL!*\n\nExample: *${usedPrefix}${command} funny cat video*`
  
  await m.reply('⏳ *Searching for video...* Please wait.')
  
  try {
    // Check if it's a URL or search query
    const isUrl = /^https?:\/\//.test(text)
    
    if (isUrl) {
      // Handle URL (YouTube, TikTok, etc.)
      if (text.includes('tiktok.com')) {
        m.reply('🎬 *TikTok Video Detected*\n\n_TikTok download requires external API setup._\n\nURL: ' + text)
      } else if (text.includes('youtube.com') || text.includes('youtu.be')) {
        m.reply('🎬 *YouTube Video Detected*\n\n_YouTube download requires external API setup._\n\nURL: ' + text)
      } else {
        m.reply('🎬 *Video URL Detected*\n\n_Video download requires external API setup._\n\nURL: ' + text)
      }
    } else {
      // Search YouTube
      const { videos } = await yts(text)
      if (!videos || !videos.length) throw '*No videos found!*'
      
      const video = videos[0]
      const caption = `🎬 *${video.title}*\n\n⏱️ Duration: ${video.timestamp}\n👁️ Views: ${formatNumber(video.views)}\n📺 Channel: ${video.author.name}\n🔗 URL: ${video.url}\n\n_Video download requires external API setup._`
      
      await conn.sendMessage(m.chat, {
        text: caption
      }, { quoted: m })
    }
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

handler.help = ['video <name/url>']
handler.tags = ['downloader']
handler.command = ['video', 'ytv', 'ytvideo']
handler.desc = 'Search and download videos from YouTube/TikTok'

export default handler
