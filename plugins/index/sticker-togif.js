/**
 * Sticker Command: Sticker to GIF
 * Convert animated sticker to GIF
 */
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { createProgressBar } from '../../lib/progress.js'

const execAsync = promisify(exec)

let handler = async (m, { conn, usedPrefix, command }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''
  
  if (!/webp/.test(mime)) {
    throw `*Reply to a sticker to convert!*\n\nUsage: Reply to an animated sticker with *${usedPrefix}${command}*`
  }
  
  const pb = createProgressBar(conn, m, { title: 'GIF Conversion', successMsg: 'Converted to GIF successfully!' })

  try {
    await pb.update(10, 'Downloading sticker...')
    let buffer = await q.download()
    
    // Check if sticker is animated (WebP files > 50KB are usually animated)
    if (buffer.length < 50000) {
      throw '*This sticker is not animated! Use .toimg for static stickers.*'
    }
    
    const tmpDir = path.join(process.cwd(), 'tmp')
    const inputPath = path.join(tmpDir, `sticker_${Date.now()}.webp`)
    const outputPath = path.join(tmpDir, `gif_${Date.now()}.gif`)
    
    await pb.update(30, 'Saving temporary files...')
    await fs.promises.writeFile(inputPath, buffer)
    
    // Convert using ffmpeg (if available)
    try {
      await pb.update(50, 'Converting with FFmpeg...')
      await execAsync(`ffmpeg -i "${inputPath}" -vf "fps=15,scale=320:-1:flags=lanczos" "${outputPath}"`)
      
      await pb.update(80, 'Reading output...')
      const gifBuffer = await fs.promises.readFile(outputPath)
      
      await pb.update(95, 'Uploading GIF...')
      await conn.sendMessage(m.chat, {
        video: gifBuffer,
        gifPlayback: true,
        caption: '🎬 *Converted to GIF*'
      }, { quoted: m })
      
      // Cleanup
      fs.promises.unlink(inputPath).catch(() => {})
      fs.promises.unlink(outputPath).catch(() => {})
      await pb.finish(true)
    } catch (e) {
      fs.promises.unlink(inputPath).catch(() => {})
      throw '*FFmpeg not available. Please install FFmpeg for GIF conversion.*'
    }
    
  } catch (e) {
    console.error(e)
    await pb.finish(false, e.message || e)
  }
}

handler.help = ['togif', 'stickertogif']
handler.tags = ['sticker']
handler.command = ['togif', 'stickertogif', 'gif']
handler.desc = 'Convert animated sticker to GIF'

export default handler
