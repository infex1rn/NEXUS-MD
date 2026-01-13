/**
 * Main Command: Menu
 * Display all available commands
 */
let handler = async (m, { conn, usedPrefix }) => {
  const plugins = global.plugins || {}
  const commands = {}
  
  // Categorize commands
  for (const name in plugins) {
    const plugin = plugins[name]
    if (!plugin.command) continue
    
    const tags = plugin.tags || ['other']
    const cmdList = Array.isArray(plugin.command) 
      ? plugin.command 
      : [plugin.command]
    
    for (const tag of (Array.isArray(tags) ? tags : [tags])) {
      if (!commands[tag]) commands[tag] = []
      commands[tag].push({
        cmd: cmdList[0],
        help: plugin.help?.[0] || cmdList[0],
        desc: plugin.desc || ''
      })
    }
  }
  
  const categoryEmoji = {
    main: '🏠',
    group: '👥',
    downloader: '📥',
    sticker: '🎨',
    tools: '🔧',
    fun: '🎮',
    utility: '⚙️',
    owner: '👑',
    economy: '💰',
    casino: '🎰',
    cards: '🎴',
    other: '📦'
  }
  
  const categoryNames = {
    main: 'Main',
    group: 'Group Admin',
    downloader: 'Downloader',
    sticker: 'Sticker',
    tools: 'Tools',
    fun: 'Fun & Games',
    utility: 'Utility',
    owner: 'Owner Only',
    economy: 'Economy',
    casino: 'Casino',
    cards: 'Anime Cards',
    other: 'Other'
  }
  
  let menuText = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🤖 *NEXUS-MD BOT*
┃━━━━━━━━━━━━━━━━━━━━━
┃  📋 *Command Menu*
┃  ⏰ ${new Date().toLocaleString()}
╰━━━━━━━━━━━━━━━━━━━━━╯

*Prefix:* ${usedPrefix}
*Total Commands:* ${Object.values(commands).flat().length}

`

  // Sort categories
  const sortOrder = ['main', 'economy', 'casino', 'cards', 'group', 'downloader', 'sticker', 'tools', 'fun', 'utility', 'owner', 'other']
  const sortedCategories = Object.keys(commands).sort((a, b) => {
    const indexA = sortOrder.indexOf(a)
    const indexB = sortOrder.indexOf(b)
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
  })
  
  for (const category of sortedCategories) {
    const cmds = commands[category]
    if (!cmds || cmds.length === 0) continue
    
    const emoji = categoryEmoji[category] || '📦'
    const name = categoryNames[category] || category.toUpperCase()
    
    menuText += `╭─── ${emoji} *${name}* ───\n`
    
    for (const { cmd, help } of cmds) {
      menuText += `│ ◦ ${usedPrefix}${help}\n`
    }
    
    menuText += `╰─────────────────\n\n`
  }
  
  menuText += `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  💡 *Tips:*
┃  • Type command for help
┃  • Example: ${usedPrefix}sticker
╰━━━━━━━━━━━━━━━━━━━━━╯

_Powered by NEXUS-MD Bot_
`.trim()
  
  await m.reply(menuText)
}

handler.help = ['menu', 'help']
handler.tags = ['main']
handler.command = ['menu', 'help', 'commands', '?']
handler.desc = 'Display all available commands'

export default handler
