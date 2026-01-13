/**
 * Tools Command: GPT / AI Chat
 * Chat with AI
 */
import fetch from 'node-fetch'

const conversationHistory = {}
const MAX_HISTORY = 5

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const userId = m.sender
  
  // Reset command
  if (command === 'resetai') {
    delete conversationHistory[userId]
    return m.reply('✅ *Conversation history cleared!* Starting fresh.')
  }
  
  if (!text) {
    throw `*Please provide a message!*\n\nExample: *${usedPrefix}${command} Hello, how are you?*\n\n*Commands:*\n- *${usedPrefix}gpt* <message> - Chat with AI\n- *${usedPrefix}resetai* - Clear chat history`
  }
  
  try {
    await m.react('🧠')
    await conn.sendPresenceUpdate('composing', m.chat)
    
    // Initialize history if not exists
    if (!conversationHistory[userId]) {
      conversationHistory[userId] = []
    }
    
    // Build messages array with history
    const messages = [
      {
        role: 'system',
        content: 'You are NEXUS-AI, a friendly and helpful WhatsApp assistant. You provide concise, accurate answers while being conversational. Keep responses relatively brief but complete.'
      },
      ...conversationHistory[userId].flatMap(h => [
        { role: 'user', content: h.user },
        { role: 'assistant', content: h.assistant }
      ]),
      { role: 'user', content: text }
    ]
    
    // Note: In production, integrate with OpenAI API or other AI service
    // For demo, provide helpful response template
    const demoResponse = `🤖 *NEXUS-AI Response*\n\nYour question: "${text}"\n\n_To enable AI responses, configure:_\n1. Get OpenAI API key\n2. Add OPENAI_API_KEY to .env\n3. Restart the bot\n\n*Or use free alternatives:*\n- HuggingFace API\n- Google AI (Gemini)\n- Anthropic Claude`
    
    await m.reply(demoResponse)
    await m.react('✅')
    
    // Store in history (for when API is configured)
    conversationHistory[userId].push({
      user: text,
      assistant: 'Demo response'
    })
    
    // Limit history
    if (conversationHistory[userId].length > MAX_HISTORY) {
      conversationHistory[userId].shift()
    }
    
  } catch (e) {
    await m.react('❌')
    m.reply(`❌ Error: ${e.message}`)
  }
}

handler.help = ['gpt <message>', 'ai <message>', 'resetai']
handler.tags = ['tools']
handler.command = ['gpt', 'ai', 'chatgpt', 'chat', 'resetai']
handler.desc = 'Chat with AI assistant'

export default handler
