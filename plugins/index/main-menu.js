/**
 * Main Command: Menu
 * Display all available commands
 */
import { formatMessage } from '../../lib/simple.js'
import { toMono, toSmallCaps } from '../../lib/font.js'
import os from 'os'
import moment from 'moment-timezone'
import fs from 'fs'
import { join } from 'path'

const { version } = JSON.parse(fs.readFileSync(join(process.cwd(), 'package.json')))

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
  
  const uptime = process.uptime()
  const d = Math.floor(uptime / 86400)
  const h = Math.floor((uptime % 86400) / 3600)
  const min = Math.floor((uptime % 3600) / 60)
  const s = Math.floor(uptime % 60)
  const runtime = `${d > 0 ? d + 'd ' : ''}${h}h ${min}m ${s}s`

  const totalMem = Math.round(os.totalmem() / 1024 / 1024)
  const freeMem = Math.round(os.freemem() / 1024 / 1024)
  const usedMem = totalMem - freeMem

  const time = moment().tz('Asia/Colombo').format('HH:mm:ss') // Defaulting to a common TZ or we could use user's if known
  const date = moment().tz('Asia/Colombo').format('DD/MM/YYYY')
  const day = moment().tz('Asia/Colombo').format('dddd')

  let headerText = `╭═══ ${global.botname} ═══⊷
┃❃╭──────────────
┃❃│ Prefix : ${usedPrefix}
┃❃│ User : ${m.name || m.sender.split('@')[0]}
┃❃│ Time : ${time}
┃❃│ Day : ${day}
┃❃│ Date : ${date}
┃❃│ Version : ${version}
┃❃│ Plugins : ${Object.keys(plugins).length}
┃❃│ Ram : ${usedMem}/${totalMem}MB
┃❃│ Uptime : ${runtime}
┃❃│ Platform : ${os.platform()} (${os.type()})
┃❃╰───────────────
╰═════════════════⊷`

  let menuText = headerText + '\n\n'

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
    
    const name = categoryNames[category] || category
    
    let categoryBody = ''
    for (const { cmd, help } of cmds) {
      categoryBody += `${toMono(help.toUpperCase())}\n`
    }
    
    menuText += formatMessage(toSmallCaps(name), categoryBody.trim()) + '\n\n'
  }
  
  menuText += formatMessage('Info', `💡 *Tips:*
• Type command for help
• Example: ${usedPrefix}sticker`, 'Powered by NEXUS-MD Bot')
  
  await m.reply(menuText)
}

handler.help = ['menu', 'help']
handler.tags = ['main']
handler.command = ['menu', 'help', 'commands', '?']
handler.desc = 'Display all available commands'

export default handler
