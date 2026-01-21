/**
 * Tools Command: DALL-E / Image Generation
 * Generate AI images from text prompts
 */
import fetch from 'node-fetch'
import { createProgressBar } from '../../lib/progress.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    throw `*Please provide a prompt to generate an image!*\n\nExample: *${usedPrefix}${command} a cat wearing sunglasses on a beach*`
  }
  
  const pb = createProgressBar(conn, m, { title: 'AI Image Generation', successMsg: 'Image generation completed!' })

  try {
    await pb.update(10, 'Analyzing prompt...')
    await m.react('🎨')
    
    await pb.update(40, 'Generating image with Nano Banana...')
    // Integration with Nano Banana API (assuming flux model as default)
    const apiUrl = `https://api.nanobana.pro/api/ai/flux?prompt=${encodeURIComponent(text)}`
    
    const response = await fetch(apiUrl)
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)

    const buffer = await response.buffer()
    if (buffer.length < 1000) throw new Error('Invalid image received from API')

    await pb.update(90, 'Finalizing render...')

    await conn.sendFile(m.chat, buffer, 'ai-image.jpg', `🎨 *Generated Image*\n\n📝 Prompt: *${text}*\n🤖 Model: *Nano Banana (Flux)*`, m)
    await m.react('✅')
    await pb.finish(true)
  } catch (e) {
    await m.react('❌')
    console.error(e)
    await pb.finish(false, e.message)
  }
}

handler.help = ['dalle <prompt>', 'imagine <prompt>']
handler.tags = ['tools']
handler.command = ['dalle', 'imagine', 'generate', 'ai-img']
handler.desc = 'Generate AI images from text descriptions'

export default handler
