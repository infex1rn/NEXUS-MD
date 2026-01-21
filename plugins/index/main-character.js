/**
 * Main Command: Character Management
 * List and set bot character/persona
 */
import { characters } from '../../lib/characters.js'
import { formatMessage } from '../../lib/simple.js'

let handler = async (m, { conn, text, usedPrefix, command, isOwner }) => {
  const botJid = conn.decodeJid(conn.user.id)
  const settings = global.db.data.settings[botJid]

  if (command === 'charlist' || command === 'characters') {
    let list = characters.map(c => `*${c.id}.* ${c.name}`).join('\n')
    let current = characters.find(c => c.id === settings.character) || characters[0]

    let message = formatMessage('Character List',
      `Choose a character for the bot:\n\n${list}\n\n*Current:* ${current.name}\n\nUse *${usedPrefix}setchar <id>* to change.`,
      'Only owners can change the character.'
    )

    // Optionally send an image of the current character
    const img = current.images[Math.floor(Math.random() * current.images.length)]
    await conn.sendFile(m.chat, img, 'char.jpg', message, m)
    return
  }

  if (command === 'setchar') {
    if (!isOwner) return m.reply('*Only the bot owner can change the character!*')
    if (!text) throw `*Please provide a character ID!*\nExample: *${usedPrefix}${command} 2*`

    const char = characters.find(c => c.id === text)
    if (!char) throw `*Character ID not found!*\nUse *${usedPrefix}charlist* to see available IDs.`

    settings.character = text
    global.botname = char.name
    global.author = char.name

    let message = `✅ *Character updated to ${char.name}!*`
    const img = char.images[Math.floor(Math.random() * char.images.length)]
    await conn.sendFile(m.chat, img, 'char.jpg', message, m)
  }
}

handler.help = ['charlist', 'setchar <id>']
handler.tags = ['main']
handler.command = ['charlist', 'characters', 'setchar', 'character']
handler.desc = 'List and set bot character/persona'

export default handler
