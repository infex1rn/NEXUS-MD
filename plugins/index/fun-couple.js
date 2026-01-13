/**
 * Fun Command: Couple
 * Randomly pair two members as a couple
 */
let handler = async (m, { conn, participants, groupMetadata }) => {
  if (!m.isGroup) {
    throw '*This command can only be used in groups!*'
  }
  
  const users = participants.map(u => u.id).filter(v => v !== conn.user.jid)
  
  if (users.length < 2) {
    throw '*Need at least 2 members to find a couple!*'
  }
  
  // Shuffle and pick two random users
  const shuffled = users.sort(() => 0.5 - Math.random())
  const person1 = shuffled[0]
  const person2 = shuffled[1]
  
  const lovePercent = Math.floor(Math.random() * 41) + 60 // 60-100%
  const hearts = '💕💖💗💘💝'.split('')
  const heart = hearts[Math.floor(Math.random() * hearts.length)]
  
  const message = `
${heart} *TODAY'S COUPLE* ${heart}

👫 *The lucky couple:*

@${person1.split('@')[0]}
        ❤️
@${person2.split('@')[0]}

💘 *Love compatibility:* ${lovePercent}%

${'💕'.repeat(Math.floor(lovePercent / 20))}

_Congratulations to today's couple!_ 🎉
`.trim()
  
  await conn.sendMessage(m.chat, {
    text: message,
    mentions: [person1, person2]
  }, { quoted: m })
}

handler.help = ['couple']
handler.tags = ['fun']
handler.command = ['couple', 'ship']
handler.desc = 'Randomly pair two group members as a couple'
handler.group = true

export default handler
