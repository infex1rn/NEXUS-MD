/**
 * Social/Roleplay Commands
 * Interact with other users using anime GIFs
 */
import fetch from 'node-fetch'

const types = [
  'hug', 'kiss', 'slap', 'kill', 'bite', 'blush', 'cuddle', 'dance',
  'glare', 'handhold', 'highfive', 'lick', 'pat', 'poke', 'smile',
  'wave', 'wink', 'yeet', 'bully', 'waifu', 'shinobu', 'megumin',
  'neko', 'awoo'
]

let handler = async (m, { conn, args, usedPrefix, command }) => {
  const type = command.toLowerCase()

  if (type === 'ship') {
    let [user1, user2] = m.mentionedJid || []
    if (!user1 && m.quoted) user1 = m.quoted.sender
    if (!user1) user1 = m.sender
    if (!user2) user2 = m.sender === user1 ? (args[0] ? args[0] : null) : user1 // fallback to sender if only one mentioned

    // If still only one user, we ship them with a random participant if in group
    if (!user2 && m.isGroup) {
      const participants = (await conn.groupMetadata(m.chat)).participants
      user2 = participants[Math.floor(Math.random() * participants.length)].id
    } else if (!user2) {
      user2 = m.sender // ship with self if all else fails
    }

    const love = Math.floor(Math.random() * 101)
    const loveChar = love > 75 ? '❤️‍🔥' : love > 50 ? '❤️' : love > 25 ? '🧡' : '💔'

    const name1 = await conn.getName(user1)
    const name2 = await conn.getName(user2)

    const caption = `
💌 *MATCHMAKING* 💌

🚢 *Ship:* ${name1} x ${name2}
💖 *Love:* ${love}%
${loveChar} *Status:* ${getShipStatus(love)}
`.trim()

    return m.reply(caption, null, { mentions: [user1, user2] })
  }

  // Handle waifu.pics types
  if (types.includes(type)) {
    const res = await fetch(`https://api.waifu.pics/sfw/${type}`)
    if (!res.ok) throw `❌ Failed to fetch ${type} GIF`
    const json = await res.json()
    const url = json.url

    let target = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null)
    let caption = ''

    if (['waifu', 'neko', 'shinobu', 'megumin', 'awoo'].includes(type)) {
      caption = `Here is your ${type}! ✨`
    } else {
      const senderName = await conn.getName(m.sender)
      const targetName = target ? await conn.getName(target) : 'themselves'
      caption = `*${senderName}* ${getActionText(type)} *${targetName}*!`
    }

    await conn.sendFile(m.chat, url, `${type}.gif`, caption, m, false, {
      mentions: target ? [target] : []
    })
  }
}

handler.help = types.concat(['ship']).map(t => `${t} [@user]`)
handler.tags = ['fun']
handler.command = types.concat(['ship'])

export default handler

function getShipStatus(love) {
  if (love === 100) return 'Soulmates! ♾️'
  if (love >= 90) return 'Perfect Match! 💍'
  if (love >= 80) return 'Very Happy Couple! 💘'
  if (love >= 70) return 'Deep Connection! 💕'
  if (love >= 60) return 'Strong Attraction! 💗'
  if (love >= 50) return 'Good Potential! 💓'
  if (love >= 40) return 'Just Friends? 💞'
  if (love >= 30) return 'It\'s Complicated... 💔'
  if (love >= 20) return 'Not Looking Good... 🔌'
  if (love >= 10) return 'Toxic... ☣️'
  return 'Total Strangers... ❄️'
}

function getActionText(type) {
  const actions = {
    hug: 'hugged',
    kiss: 'kissed',
    slap: 'slapped',
    kill: 'killed',
    bite: 'bit',
    blush: 'blushed at',
    cuddle: 'cuddled',
    dance: 'danced with',
    glare: 'glared at',
    handhold: 'held hands with',
    highfive: 'gave a high-five to',
    lick: 'licked',
    pat: 'patted',
    poke: 'poked',
    smile: 'smiled at',
    wave: 'waved to',
    wink: 'winked at',
    yeet: 'yeeted',
    bully: 'bullied'
  }
  return actions[type] || type
}
