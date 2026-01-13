/**
 * Tools Command: Translate
 * Translate text to any language
 */
import translate from 'google-translate-api-x'

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
  if (!text) {
    throw `*Please provide text to translate!*\n\nUsage:\n*${usedPrefix}${command} <lang> <text>*\n*${usedPrefix}${command} en Hola mundo*\n\n*Common language codes:*\nen = English\nes = Spanish\nfr = French\nde = German\npt = Portuguese\nja = Japanese\nzh = Chinese\nhi = Hindi\nar = Arabic`
  }
  
  try {
    let targetLang = args[0]?.toLowerCase() || 'en'
    let textToTranslate = args.slice(1).join(' ')
    
    // If no separate language code, assume English and use all text
    if (!textToTranslate) {
      targetLang = 'en'
      textToTranslate = text
    }
    
    await m.reply('🌐 *Translating...*')
    
    const result = await translate(textToTranslate, { to: targetLang })
    
    const response = `🌐 *Translation*\n\n📝 *Original (${result.from.language.iso}):*\n${textToTranslate}\n\n✅ *Translated (${targetLang}):*\n${result.text}`
    
    await m.reply(response)
    
  } catch (e) {
    m.reply(`❌ Error: ${e.message}\n\n_Make sure you're using a valid language code._`)
  }
}

handler.help = ['translate <lang> <text>', 'tr <lang> <text>']
handler.tags = ['tools']
handler.command = ['translate', 'tr', 'tl']
handler.desc = 'Translate text to any language'

export default handler
