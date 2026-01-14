/**
 * Tools Command: TTS (Text to Speech)
 * Convert text to voice note
 */
import { Text2Speech } from 'better-node-gtts'
import fs from 'fs'
import path from 'path'

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
  if (!text) {
    throw `*Please provide text to convert to speech!*\n\nUsage:\n*${usedPrefix}${command} <text>*\n*${usedPrefix}${command} en Hello world*\n\n*Language codes:* en, es, fr, de, pt, ja, ko, hi, ar`
  }
  
  try {
    let lang = 'en'
    let speechText = text
    
    // Check if first word is a language code
    const langCodes = ['en', 'es', 'fr', 'de', 'pt', 'it', 'ja', 'ko', 'zh', 'hi', 'ar', 'ru']
    if (args[0] && langCodes.includes(args[0].toLowerCase())) {
      lang = args[0].toLowerCase()
      speechText = args.slice(1).join(' ')
    }
    
    if (!speechText) {
      throw '*Please provide text after the language code!*'
    }
    
    await m.reply('🔊 *Converting to speech...*')
    
    const tmpPath = path.join(process.cwd(), 'tmp', `tts_${Date.now()}.mp3`)
    
    // Create Text2Speech instance with the specified language
    const tts = new Text2Speech(lang)
    await tts.save(tmpPath, speechText)
    
    await conn.sendMessage(m.chat, {
      audio: fs.readFileSync(tmpPath),
      mimetype: 'audio/mp4',
      ptt: true
    }, { quoted: m })
    
    // Clean up
    fs.unlinkSync(tmpPath)
    
  } catch (e) {
    m.reply(`❌ Error: ${e.message}`)
  }
}

handler.help = ['tts <text>', 'tts <lang> <text>']
handler.tags = ['tools']
handler.command = ['tts', 'say', 'speak']
handler.desc = 'Convert text to voice note'

export default handler
