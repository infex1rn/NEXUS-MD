/**
 * Tools Command: OCR
 * Extract text from images
 */
import Tesseract from 'tesseract.js'

let handler = async (m, { conn, usedPrefix, command }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || q.mediaType || ''
  
  if (!/image\/(jpe?g|png|webp)/.test(mime)) {
    throw `*Reply to an image to extract text!*\n\nUsage: Reply to an image with *${usedPrefix}${command}*`
  }
  
  try {
    await m.reply('🔍 *Extracting text...* This may take a moment.')
    
    let buffer = await q.download()
    
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng', {
      logger: m => {} // Silent logger
    })
    
    if (!text || text.trim().length === 0) {
      throw '*No text found in the image!*'
    }
    
    const response = `📝 *Extracted Text*\n\n${text.trim()}`
    await m.reply(response)
    
  } catch (e) {
    m.reply(`❌ Error: ${e.message || e}`)
  }
}

handler.help = ['ocr']
handler.tags = ['tools']
handler.command = ['ocr', 'totext', 'readtext']
handler.desc = 'Extract text from an image (OCR)'

export default handler
