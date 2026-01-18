/**
 * RPG Command: Rank
 * Display user's level and XP
 */
import { formatMessage } from '../../lib/simple.js'
import { toMono } from '../../lib/font.js'

let handler = async (m, { conn }) => {
  let target = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : m.sender)
  let user = global.db.data.users[target]
  if (!user) throw '❌ User not found in database!'

  const exp = user.exp || 0
  const level = user.level || Math.floor(0.1 * Math.sqrt(exp)) + 1
  const nextLevelXp = Math.pow((level) * 10, 2)
  const currentLevelXp = Math.pow((level - 1) * 10, 2)

  const progress = exp - currentLevelXp
  const needed = nextLevelXp - currentLevelXp
  const percentage = Math.min(Math.floor((progress / needed) * 100), 100)

  // Create progress bar
  const barLength = 10
  const filledLength = Math.floor((percentage / 100) * barLength)
  const bar = '▓'.repeat(filledLength) + '░'.repeat(barLength - filledLength)

  const caption = `
⭐ *USER RANK* ⭐

👤 *User:* @${target.split('@')[0]}
🎖️ *Role:* ${user.role || 'Novice'}
🆙 *Level:* ${level}

✨ *XP:* ${exp} / ${nextLevelXp}
📊 *Progress:* [${bar}] ${percentage}%

_Keep messaging to earn more XP!_
`.trim()

  return m.reply(caption, null, { mentions: [target] })
}

handler.help = ['rank', 'level']
handler.tags = ['economy']
handler.command = ['rank', 'level', 'lvl']

export default handler
