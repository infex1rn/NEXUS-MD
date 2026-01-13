/**
 * Downloader Command: Instagram
 * Download Instagram media
 */
import fetch from 'node-fetch'

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) throw `*Please provide an Instagram URL!*\n\nExample: *${usedPrefix}${command} https://www.instagram.com/p/ABC123/*`
  
  if (!/https?:\/\/(www\.)?instagram\.(com|stories)\/([^/?#&]+)/i.test(args[0]))
    throw `*Please provide a valid Instagram URL!*`

  await m.reply('📥 *Downloading Instagram media...* Please wait.')
  
  try {
    // Note: In production, integrate with a proper Instagram API
    const message = `📸 *Instagram Download*\n\n🔗 URL: ${args[0]}\n\n_To enable Instagram downloads, configure:_\n- Cobalt API (api.cobalt.tools)\n- Or other Instagram downloader API\n\n*Add API credentials to .env file*`
    
    await m.reply(message)
  } catch (error) {
    m.reply(`❌ Error: ${error.message}`)
  }
}

handler.help = ['ig <url>', 'instagram <url>']
handler.tags = ['downloader']
handler.command = ['ig', 'igdl', 'instagram', 'igimg', 'igvid', 'insta']
handler.desc = 'Download Instagram media (images, videos, stories, reels)'

export default handler
