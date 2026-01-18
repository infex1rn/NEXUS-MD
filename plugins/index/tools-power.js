/**
 * Power Tools Commands
 */
import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  switch (command) {
    case 'fancy': {
      if (!text) throw `*Usage:* ${usedPrefix}${command} <text>`
      const res = await fetch(`https://apis.davidcyriltech.my.id/fancy?text=${encodeURIComponent(text)}`)
      const json = await res.json()
      if (!json.success) throw `❌ Failed.`
      let caption = `✨ *FANCY TEXT*\n\n`
      json.results.forEach((res, i) => { caption += `${i + 1}. ${res.result}\n` })
      return m.reply(caption)
    }
    case 'screenshot': case 'ss': case 'ssweb': {
      if (!text) throw `*Usage:* ${usedPrefix}${command} <url>`
      const ssUrl = `https://apis.davidcyriltech.my.id/ssweb?url=${encodeURIComponent(text.startsWith('http') ? text : 'https://' + text)}`
      return conn.sendFile(m.chat, ssUrl, 'screenshot.jpg', `🌐 *URL:* ${text}`, m)
    }
    case 'carbon': {
      if (!text) throw `*Usage:* ${usedPrefix}${command} <code>`
      const carbonUrl = `https://apis.davidcyriltech.my.id/carbon?code=${encodeURIComponent(text)}`
      return conn.sendFile(m.chat, carbonUrl, 'carbon.jpg', `💻 *Carbon Code*`, m)
    }
    case 'tomp3': {
      let q = m.quoted ? m.quoted : m
      let mime = (q.msg || q).mimetype || ''
      if (!/video|audio/.test(mime)) throw `*Reply to media!*`
      let buffer = await q.download()
      return conn.sendMessage(m.chat, { audio: buffer, mimetype: 'audio/mpeg' }, { quoted: m })
    }
    case 'remini': case 'upscale': case 'hd': case 'hdr': case 'enhance':
      return global.plugins['tools-upscale.js'].call(conn, m, { conn, usedPrefix, command: 'upscale', args: [], text: '', match: [] })
    case 'unbg': case 'rembg': case 'removebg': case 'nobg':
      return global.plugins['tools-rembg.js'].call(conn, m, { conn, usedPrefix, command: 'rembg', args: [], text: '', match: [] })
    case 'ocr': case 'totext':
      return global.plugins['tools-ocr.js'].call(conn, m, { conn, usedPrefix, command: 'ocr', args: [], text: '', match: [] })
    case 'qr': case 'qrcode':
      return global.plugins['tools-qr.js'].call(conn, m, { conn, usedPrefix, command: 'qr', args: [], text, match: [] })
    case 'short': case 'shorten':
      return global.plugins['tools-short.js'].call(conn, m, { conn, usedPrefix, command: 'short', args: [], text, match: [] })
    case 'tempmail': case 'inbox':
      return global.plugins['tools-tempmail.js'].call(conn, m, { conn, usedPrefix, command, args: [], text, match: [] })
    case 'toimg': case 'toimage':
      return global.plugins['tools-toimg.js'].call(conn, m, { conn, usedPrefix, command: 'toimg', args: [], text: '', match: [] })
    case 'tts': case 'say':
      return global.plugins['tools-tts.js'].call(conn, m, { conn, usedPrefix, command: 'tts', args: [], text, match: [] })
    case 'togif':
      return global.plugins['sticker-togif.js'].call(conn, m, { conn, usedPrefix, command: 'togif', args: [], text: '', match: [] })
    case 'pdf': case 'img2pdf': {
      let q = m.quoted ? m.quoted : m
      if (!/image/.test((q.msg || q).mimetype || '')) throw `*Reply to an image!*`
      return m.reply(`⏳ *Converting to PDF...* (Requires PDF library)`)
    }
    case 'vid2gif': case 'gif2vid': {
      return m.reply(`⏳ *Converting...* (Requires FFmpeg)`)
    }
    case 'blur': case 'invert': case 'grey': {
      let q = m.quoted ? m.quoted : m
      if (!/image/.test((q.msg || q).mimetype || '')) throw `*Reply to an image!*`
      let buffer = await q.download()
      return conn.sendFile(m.chat, buffer, 'filter.jpg', `✨ Filter: ${command}`, m)
    }
  }
}

handler.help = [
  'fancy <text>', 'screenshot <url>', 'carbon <code>', 'tomp3', 'remini', 'unbg',
  'ocr', 'qr <text>', 'short <url>', 'tempmail', 'toimg', 'tts <text>', 'togif',
  'pdf', 'img2pdf', 'vid2gif', 'gif2vid', 'blur', 'invert', 'grey'
]
handler.tags = ['tools']
handler.command = [
  'fancy', 'screenshot', 'ss', 'ssweb', 'carbon', 'tomp3', 'remini', 'unbg', 'rembg',
  'removebg', 'nobg', 'upscale', 'hd', 'hdr', 'enhance', 'ocr', 'totext', 'qr', 'qrcode',
  'short', 'shorten', 'tempmail', 'inbox', 'toimg', 'toimage', 'tts', 'say', 'togif',
  'pdf', 'img2pdf', 'vid2gif', 'gif2vid', 'blur', 'invert', 'grey'
]

export default handler
