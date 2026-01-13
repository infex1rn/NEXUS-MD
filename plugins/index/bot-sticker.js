/**
 * Media Command: Sticker
 * Convert image/video to sticker
 */
import { sticker } from '../../lib/sticker.js'

let handler = async (m, { conn, args, usedPrefix, command }) => {
  try {
    let [packname, ...authorParts] = args.join(' ').split('|')
    let author = authorParts.join('|') || global.author
    
    // Get quoted message or media
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''
    
    let buffer = /image|video|webp/.test(mime) ? await q.download() : null
    let url = !buffer && args[0] && isUrl(args[0]) ? args[0] : null
    
    if (!buffer && !url) {
      throw `*Reply to an image, video, or GIF to make a sticker!*\n\nExample:\n- Reply to media with *${usedPrefix}${command}*\n- *${usedPrefix}${command} packname | author*`
    }
    
    m.reply('⏳ *Creating sticker...* Please wait.')
    
    let stickerBuffer = await sticker(buffer, url, packname?.trim() || global.packname, author?.trim() || global.author)
    await conn.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m })
  } catch (err) {
    m.reply(`❌ Error: ${err.message || err}`)
  }
}

const isUrl = text => text?.match(
  new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)(jpe?g|gif|png|webp|mp4)/i)
)

handler.help = ['sticker', 's [packname | author]']
handler.tags = ['sticker']
handler.command = ['sticker', 's', 'stiker']
handler.desc = 'Convert an image, video, or GIF to a sticker'

export default handler
