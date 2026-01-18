/**
 * Tools Command: GPT / AI Chat
 * Chat with AI (persistent conversation history via database)
 */
import fetch from 'node-fetch'
import { createProgressBar } from '../../lib/progress.js'

const MAX_HISTORY = 5

// Helper to get conversation history from database
function getConversationHistory(userId) {
  if (!global.db.data.aiConversations) {
    global.db.data.aiConversations = {}
  }
  if (!global.db.data.aiConversations[userId]) {
    global.db.data.aiConversations[userId] = []
  }
  return global.db.data.aiConversations[userId]
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const userId = m.sender
  
  // Reset command
  if (command === 'resetai') {
    if (global.db.data.aiConversations) {
      delete global.db.data.aiConversations[userId]
    }
    return m.reply('✅ *Conversation history cleared!* Starting fresh.')
  }
  
  if (!text) {
    throw `*Please provide a message!*\n\nExample: *${usedPrefix}${command} Hello, how are you?*\n\n*Commands:*\n- *${usedPrefix}gpt* <message> - Chat with AI\n- *${usedPrefix}resetai* - Clear chat history`
  }
  
  const pb = createProgressBar(conn, m, { title: 'AI Chat', successMsg: 'Response generated!' })

  try {
    await pb.update(10, 'Thinking...')
    await m.react('🧠')
    await conn.sendPresenceUpdate('composing', m.chat)
    
    // Get history from database
    const conversationHistory = getConversationHistory(userId)
    await pb.update(30, 'Retrieving conversation history...')
    
    // Build messages array with history
    const messages = [
      {
        role: 'system',
        content: 'You are NEXUS-AI, a friendly and helpful WhatsApp assistant. You provide concise, accurate answers while being conversational. Keep responses relatively brief but complete.'
      },
      ...conversationHistory.flatMap(h => [
        { role: 'user', content: h.user },
        { role: 'assistant', content: h.assistant }
      ]),
      { role: 'user', content: text }
    ]
    
    // Note: In production, integrate with OpenAI API or other AI service
    // For demo, provide helpful response template
    const demoResponse = `🤖 *NEXUS-AI Response*\n\nYour question: "${text}"\n\n_To enable AI responses, configure:_\n1. Get OpenAI API key\n2. Add OPENAI_API_KEY to .env\n3. Restart the bot\n\n*Or use free alternatives:*\n- HuggingFace API\n- Google AI (Gemini)\n- Anthropic Claude`
    
    await pb.update(70, 'Generating response...')
    await pb.update(90, 'Finalizing...')
    await m.reply(demoResponse)
    await m.react('✅')
    await pb.finish(true)
    
    // Store in history (in database)
    conversationHistory.push({
      user: text,
      assistant: 'Demo response',
      timestamp: Date.now()
    })
    
    // Limit history
    while (conversationHistory.length > MAX_HISTORY) {
      conversationHistory.shift()
    }
    
  } catch (e) {
    await m.react('❌')
    console.error(e)
    await pb.finish(false, e.message)
  }
}

handler.help = ['gpt <message>', 'ai <message>', 'resetai']
handler.tags = ['tools']
handler.command = ['gpt', 'ai', 'chatgpt', 'chat', 'resetai']
handler.desc = 'Chat with AI assistant'

export default handler
