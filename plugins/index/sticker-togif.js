/**
 * Sticker Command: Sticker to GIF
 * Convert animated sticker to GIF
 */
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

let handler = async (m, { conn, usedPrefix, command }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''
  
  if (!/webp/.test(mime)) {
    throw `*Reply to a sticker to convert!*\n\nUsage: Reply to an animated sticker with *${usedPrefix}${command}*`
  }
  
  try {
    await m.reply('🔄 *Converting sticker to GIF...* Please wait.')
    
    let buffer = await q.download()
    
    // Check if sticker is animated (WebP files > 50KB are usually animated)
    if (buffer.length < 50000) {
      throw '*This sticker is not animated! Use .toimg for static stickers.*'
    }
    
    const tmpDir = path.join(process.cwd(), 'tmp')
    const inputPath = path.join(tmpDir, `sticker_${Date.now()}.webp`)
    const outputPath = path.join(tmpDir, `gif_${Date.now()}.gif`)
    
    await fs.promises.writeFile(inputPath, buffer)
    
    // Convert using ffmpeg (if available)
    try {
      await execAsync(`ffmpeg -i "${inputPath}" -vf "fps=15,scale=320:-1:flags=lanczos" "${outputPath}"`)
      
      const gifBuffer = await fs.promises.readFile(outputPath)
      
      await conn.sendMessage(m.chat, {
        video: gifBuffer,
        gifPlayback: true,
        caption: '🎬 *Converted to GIF*'
      }, { quoted: m })
      
      // Cleanup
      fs.promises.unlink(inputPath).catch(() => {})
      fs.promises.unlink(outputPath).catch(() => {})
      
    } catch (e) {
      fs.promises.unlink(inputPath).catch(() => {})
      throw '*FFmpeg not available. Please install FFmpeg for GIF conversion.*'
    }
    
  } catch (e) {
    m.reply(`❌ Error: ${e.message || e}`)
  }
}

handler.help = ['togif', 'stickertogif']
handler.tags = ['sticker']
handler.command = ['togif', 'stickertogif', 'gif']
handler.desc = 'Convert animated sticker to GIF'

export default handler
