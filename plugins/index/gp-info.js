/**
 * Group Command: Group Info
 * Display group information
 */
let handler = async (m, { conn, participants, groupMetadata }) => {
  try {
    const pp = await conn.profilePictureUrl(m.chat, 'image').catch(_ => null) || 'https://i.imgur.com/8B4jwGq.jpeg'
    
    const chat = global.db.data.chats[m.chat] || {}
    const groupAdmins = participants.filter(p => p.admin)
    const listAdmin = groupAdmins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n')
    const owner = groupMetadata.owner || groupAdmins.find(p => p.admin === 'superadmin')?.id || m.chat.split('-')[0] + '@s.whatsapp.net'
    
    const text = `
┌──「 *GROUP INFO* 」──╮

🆔 *ID:* ${groupMetadata.id}

📛 *Name:* ${groupMetadata.subject}

👥 *Members:* ${participants.length}

👑 *Owner:* @${owner.split('@')[0]}

🛡️ *Admins (${groupAdmins.length}):*
${listAdmin}

⚙️ *Settings:*
• Welcome: ${chat.welcome ? '✅' : '❎'}
• Anti-Link: ${chat.antiLink ? '✅' : '❎'}
• Detect: ${chat.detect ? '✅' : '❎'}

📝 *Description:*
${groupMetadata.desc?.toString() || 'No description'}

╰────────────────╯
`.trim()
    
    await conn.sendMessage(m.chat, {
      text: text,
      mentions: [...groupAdmins.map(v => v.id), owner]
    }, { quoted: m })
    
  } catch (e) {
    m.reply(`❌ Error: ${e.message}`)
  }
}

handler.help = ['groupinfo', 'infogroup']
handler.tags = ['group']
handler.command = ['groupinfo', 'infogroup', 'infogp', 'gcinfo']
handler.desc = 'Get detailed group information'
handler.group = true

export default handler
