/**
 * Media Command: Video
 * Download videos from YouTube/TikTok
 */
import fetch from 'node-fetch'
import yts from 'yt-search'
import { createProgressBar } from '../../lib/progress.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `*Please provide a video name or URL!*\n\nExample: *${usedPrefix}${command} funny cat video*`
  
  const pb = createProgressBar(conn, m, { title: 'Video Downloader', successMsg: 'Video processed!' })
  
  try {
    await pb.update(10, 'Searching for video...')
    // Check if it's a URL or search query
    const isUrl = /^https?:\/\//.test(text)
    
    let videoUrl = text
    let videoInfo = null

    if (!isUrl) {
      // Search YouTube
      await pb.update(20, 'Searching for video...')
      const { videos } = await yts(text)
      if (!videos || !videos.length) {
        await pb.finish(false, 'No videos found!')
        return
      }
      videoInfo = videos[0]
      videoUrl = videoInfo.url
    } else if (text.includes('youtube.com') || text.includes('youtu.be')) {
      await pb.update(20, 'Fetching video info...')
      const { videos } = await yts(text)
      if (videos && videos.length) videoInfo = videos[0]
    }

    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      await pb.update(40, 'Fetching metadata from API...')
      const apiUrl = `https://apis.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(videoUrl)}`

      const response = await fetch(apiUrl)
      const data = await response.json()
      
      if (data.status !== 200 || !data.success || !data.result.download_url) {
        throw new Error('Failed to fetch the video. Please try again later.')
      }

      const downloadUrl = data.result.download_url
      const title = data.result.title || videoInfo?.title || 'YouTube Video'

      await pb.update(60, 'Sending video info...')
      const caption = `🎬 *NEXUS-MD VIDEO* 🎬\n\n` +
                      `📝 *Title:* ${title}\n` +
                      (videoInfo ? `⏱️ *Duration:* ${videoInfo.timestamp}\n👁️ *Views:* ${formatNumber(videoInfo.views)}\n📺 *Channel:* ${videoInfo.author.name}\n` : '') +
                      `🔗 *URL:* ${videoUrl}`
      
      await conn.sendMessage(m.chat, {
        image: { url: data.result.thumbnail || videoInfo?.thumbnail || '' },
        caption
      }, { quoted: m })

      await pb.update(80, 'Sending video file...')
      await conn.sendMessage(m.chat, {
        video: { url: downloadUrl },
        mimetype: 'video/mp4',
        fileName: `${title}.mp4`
      }, { quoted: m })

      await pb.update(95, 'Sending document...')
      await conn.sendMessage(m.chat, {
          document: { url: downloadUrl },
          mimetype: 'video/mp4',
          fileName: `${title}.mp4`,
          caption: `*${title}*\n> *©️ NEXUS-MD DOWNLOADER*`
      }, { quoted: m })

      await pb.finish(true)
    } else if (isUrl && text.includes('tiktok.com')) {
      await pb.finish(false, 'TikTok download requires specific API.')
    } else if (isUrl) {
      await pb.finish(false, 'Unsupported video URL.')
    }
  } catch (e) {
    console.error(e)
    await pb.finish(false, e.message || e)
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
