/**
 * AI Command: Auto Chatbot
 * Automatically responds to mentions, replies, and DMs using Gemini AI
 */
import fetch from 'node-fetch'
import { areJidsSameUser } from '@whiskeysockets/baileys'

let handler = m => m

handler.before = async (m, { conn, isOwner }) => {
  if (m.isBaileys || m.fromMe) return
  if (!m.text) return

  const botJid = conn.decodeJid(conn.user.id)
  const chat = global.db.data.chats[m.chat]
  const settings = global.db.data.settings[botJid]

  // Logic for triggering the chatbot
  const isMentioned = m.mentionedJid && m.mentionedJid.includes(botJid)
  const isReplyToBot = m.quoted && areJidsSameUser(m.quoted.sender, botJid)
  const isDM = !m.isGroup
  const isChatbotEnabled = m.isGroup ? chat?.chatbot : true // Always enabled in DMs for now or use a setting

  // If it's a command, don't trigger auto-chatbot (to avoid double response)
  const isCommand = m.text.startsWith('.') || m.text.startsWith('/') || m.text.startsWith('!')
  if (isCommand) return

  if (isChatbotEnabled && (isMentioned || isReplyToBot || isDM)) {
    // Check if we already have a response in progress to avoid spam
    conn.chatbot_queue = conn.chatbot_queue || new Set()
    if (conn.chatbot_queue.has(m.chat)) return
    conn.chatbot_queue.add(m.chat)

    try {
      await conn.sendPresenceUpdate('composing', m.chat)

      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) return // Silent fail if no API key

      const prompt = `You are ${global.botname || 'NEXUS-AI'}. A user said: "${m.text}". Provide a short, friendly, and helpful response. Keep it under 2 lines if possible.`

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      })

      if (response.ok) {
        const data = await response.json()
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (aiResponse) {
          await m.reply(aiResponse)
        }
      }
    } catch (e) {
      console.error('Chatbot error:', e)
    } finally {
      conn.chatbot_queue.delete(m.chat)
    }
  }
}

export default handler
