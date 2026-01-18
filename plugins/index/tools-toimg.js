/**
 * Tools Command: Toimg
 * Convert sticker to image
 */
import { createProgressBar } from '../../lib/progress.js'

let handler = async (m, { conn, usedPrefix, command }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''
  
  if (!/webp/.test(mime)) {
    throw `*Reply to a sticker to convert to image!*\n\nUsage: Reply to a sticker with *${usedPrefix}${command}*`
  }
  
  const pb = createProgressBar(conn, m, { title: 'Image Conversion', successMsg: 'Converted to image successfully!' })

  try {
    await pb.update(20, 'Downloading sticker...')
    let buffer = await q.download()
    
    await pb.update(70, 'Processing image...')
    await conn.sendMessage(m.chat, {
      image: buffer,
      caption: '🖼️ *Converted to Image*'
    }, { quoted: m })
    
    await pb.finish(true)
  } catch (e) {
    console.error(e)
    await pb.finish(false, e.message || e)
  }
}

handler.help = ['toimg', 'toimage']
handler.tags = ['tools']
handler.command = ['toimg', 'toimage', 'stickertoimg']
handler.desc = 'Convert sticker to image'

export default handler
