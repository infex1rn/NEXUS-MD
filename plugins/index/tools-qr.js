/**
 * Tools Command: QR Code Generator
 * Generate QR code from text/URL
 */
import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `*Please provide text or URL for QR code!*\n\nExample: *${usedPrefix}${command} https://example.com*`
  
  try {
    await m.reply('📱 *Generating QR code...* Please wait.')
    
    // Using QR Server API (free, no auth)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(text)}`
    
    await conn.sendMessage(m.chat, {
      image: { url: qrUrl },
      caption: `📱 *QR Code Generated*\n\n📝 Data: ${text.length > 100 ? text.slice(0, 100) + '...' : text}`
    }, { quoted: m })
    
  } catch (e) {
    m.reply(`❌ Error: ${e.message}`)
  }
}

handler.help = ['qr <text/url>']
handler.tags = ['tools']
handler.command = ['qr', 'qrcode', 'barcode']
handler.desc = 'Generate QR code from text or URL'

export default handler
