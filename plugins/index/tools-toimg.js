/**
 * Tools Command: Toimg
 * Convert sticker to image
 */
let handler = async (m, { conn, usedPrefix, command }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''
  
  if (!/webp/.test(mime)) {
    throw `*Reply to a sticker to convert to image!*\n\nUsage: Reply to a sticker with *${usedPrefix}${command}*`
  }
  
  try {
    let buffer = await q.download()
    
    await conn.sendMessage(m.chat, {
      image: buffer,
      caption: '🖼️ *Converted to Image*'
    }, { quoted: m })
    
  } catch (e) {
    m.reply(`❌ Error: ${e.message || e}`)
  }
}

handler.help = ['toimg', 'toimage']
handler.tags = ['tools']
handler.command = ['toimg', 'toimage', 'stickertoimg']
handler.desc = 'Convert sticker to image'

export default handler
