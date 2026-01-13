/**
 * Utility Command: Base64
 * Encode/decode base64 text
 */
let handler = async (m, { text, args, usedPrefix, command }) => {
  const action = args[0]?.toLowerCase()
  const input = args.slice(1).join(' ')
  
  if (!action || !['encode', 'decode', 'e', 'd'].includes(action)) {
    throw `*Please specify encode or decode!*\n\nUsage:\n• *${usedPrefix}${command} encode <text>*\n• *${usedPrefix}${command} decode <base64>*`
  }
  
  if (!input) throw '*Please provide text to encode/decode!*'
  
  try {
    let result
    
    if (['encode', 'e'].includes(action)) {
      result = Buffer.from(input).toString('base64')
      m.reply(`🔐 *Base64 Encode*\n\n📝 Input: ${input}\n✅ Output: ${result}`)
    } else {
      result = Buffer.from(input, 'base64').toString('utf-8')
      m.reply(`🔓 *Base64 Decode*\n\n📝 Input: ${input}\n✅ Output: ${result}`)
    }
    
  } catch (e) {
    m.reply(`❌ Error: Invalid input for ${action}`)
  }
}

handler.help = ['base64 encode <text>', 'base64 decode <base64>']
handler.tags = ['utility']
handler.command = ['base64', 'b64']
handler.desc = 'Encode or decode base64 text'

export default handler
