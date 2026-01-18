/**
 * Media Command: Play
 * Search and download music from YouTube
 */
import fetch from 'node-fetch'
import yts from 'yt-search'
import { createProgressBar } from '../../lib/progress.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `*Please provide a song name!*\n\nExample: *${usedPrefix}${command} shape of you*`
  
  conn.NEXUSPLAY = conn.NEXUSPLAY || {}
  
  await m.reply('⏳ *Searching...* Please wait.')
  
  try {
    const { videos } = await yts(text)
    if (!videos || !videos.length) throw '*No results found!*'
    
    const results = videos.slice(0, 10)
    const infoText = `🎵 *NEXUS-MD MUSIC PLAYER* 🎵\n\n*Reply with the number (1-${results.length}) to download:*\n\n`
    
    const orderedLinks = results.map((video, index) => 
      `*${index + 1}.* ${video.title}\n   Duration: ${video.timestamp} | Views: ${formatNumber(video.views)}`
    )
    
    const fullText = infoText + orderedLinks.join('\n\n')
    const { key } = await m.reply(fullText)
    
    conn.NEXUSPLAY[m.sender] = {
      results,
      key,
      timeout: setTimeout(() => {
        conn.sendMessage(m.chat, { delete: key })
        delete conn.NEXUSPLAY[m.sender]
      }, 120 * 1000)
    }
  } catch (e) {
    m.reply(`❌ Error: ${e.message || e}`)
  }
}

handler.before = async (m, { conn }) => {
  conn.NEXUSPLAY = conn.NEXUSPLAY || {}
  if (m.isBaileys || !(m.sender in conn.NEXUSPLAY)) return false
  
  const { results, key, timeout } = conn.NEXUSPLAY[m.sender]
  if (!m.quoted || m.quoted.id !== key.id || !m.text) return false
  
  const inputNumber = Number(m.text.trim())
  if (inputNumber >= 1 && inputNumber <= results.length) {
    clearTimeout(timeout)
    
    const selected = results[inputNumber - 1]
    
    const pb = createProgressBar(conn, m, { title: 'Downloading Audio', successMsg: 'Audio sent successfully!' })

    try {
      await pb.update(10, 'Initializing download...')
      
      const apiUrl = `https://ironman.koyeb.app/ironman/dl/yta?url=${encodeURIComponent(selected.url)}`
      
      await pb.update(30, 'Fetching data from API...')
      const response = await fetch(apiUrl)
      if (!response.ok) throw new Error(`API responded with status: ${response.status}`)

      await pb.update(60, 'Processing audio buffer...')
      const buffer = await response.buffer()
      
      await pb.update(90, 'Sending audio file...')
      await conn.sendMessage(m.chat, {
        audio: buffer,
        mimetype: 'audio/mpeg',
        ptt: false,
        fileName: `${selected.title}.mp3`
      }, { quoted: m })
      
      await pb.finish(true)
    } catch (error) {
      console.error(error)
      await pb.finish(false, error.message)
    } finally {
      delete conn.NEXUSPLAY[m.sender]
    }
  } else if (!isNaN(inputNumber)) {
    m.reply(`*Please select a number between 1 and ${results.length}*`)
  }
  
  return false
}

function formatNumber(num) {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num?.toString() || '0'
}

handler.help = ['play <song name>']
handler.tags = ['downloader']
handler.command = ['play', 'song', 'music']
handler.desc = 'Search and download music from YouTube'

export default handler
