/**
 * Group Lock Plugin - Toggle bot activation in groups
 */
let handler = async (m, { conn, text, args, usedPrefix, command }) => {
    if (args[0] !== 'group') return
    if (args.length < 3) throw new Error(`*Format:* ${usedPrefix + command} group <on/off> <password>\n*Example:* ${usedPrefix + command} group on 1234`)

    let action = args[1].toLowerCase()
    let password = args[2]

    if (password !== '1234') throw new Error(`❌ *Access Denied:* Incorrect password!`)

    if (action === 'on') {
        global.db.data.chats[m.chat].active = true
        m.reply(`✅ *Bot Activated:* NEXUS-MD is now active in this group.`)
    } else if (action === 'off') {
        global.db.data.chats[m.chat].active = false
        m.reply(`🔒 *Bot Deactivated:* NEXUS-MD will now ignore commands in this group.`)
    } else {
        throw new Error(`*Format:* ${usedPrefix + command} group <on/off> <password>`)
    }
}

handler.help = ['bot group <on/off> <password>']
handler.tags = ['group']
handler.command = ['bot']
handler.group = true

export default handler
