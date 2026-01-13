/**
 * Main Command: List Commands
 * Display all available commands in categories
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const tags = {
  'main': '🏠 Main',
  'group': '👥 Group',
  'downloader': '📥 Downloader',
  'sticker': '🎨 Sticker',
  'tools': '🔧 Tools',
  'fun': '🎮 Fun',
  'utility': '⚙️ Utility',
  'owner': '👑 Owner',
  'config': '⚙️ Config',
  'other': '📦 Other'
}

let handler = async (m, { conn, usedPrefix, args }) => {
  try {
    const plugins = global.plugins || {}
    const commandsMap = {}
    
    // Initialize categories
    for (let tag in tags) {
      commandsMap[tag] = []
    }
    
    // Collect commands by category
    for (let name in plugins) {
      const plugin = plugins[name]
      if (!plugin || !plugin.help || !plugin.tags) continue
      
      const pluginTags = Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags]
      
      for (const tag of pluginTags) {
        if (!(tag in commandsMap)) commandsMap[tag] = []
        
        const help = Array.isArray(plugin.help) ? plugin.help : [plugin.help]
        for (let cmd of help) {
          commandsMap[tag].push({
            cmd: cmd,
            desc: plugin.desc || ''
          })
        }
      }
    }
    
    // Filter by category if specified
    const filterTag = args[0]?.toLowerCase()
    
    let text = `
╭━━━⬣ *NEXUS-MD COMMANDS* ⬣━━━╮
┃
┃ 📋 *Total:* ${Object.values(commandsMap).flat().length} commands
┃ ⌨️ *Prefix:* ${usedPrefix}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯

`
    
    const sortOrder = ['main', 'group', 'downloader', 'sticker', 'tools', 'fun', 'utility', 'config', 'owner', 'other']
    
    for (const tag of sortOrder) {
      if (filterTag && filterTag !== tag) continue
      
      const cmds = commandsMap[tag]
      if (!cmds || cmds.length === 0) continue
      
      const emoji = tags[tag]?.split(' ')[0] || '📦'
      const name = tags[tag] || tag.toUpperCase()
      
      text += `┌──⬣ ${name} ⬣──\n`
      
      for (const { cmd } of cmds) {
        text += `│ ◦ ${usedPrefix}${cmd}\n`
      }
      
      text += `└───────────────\n\n`
    }
    
    text += `\n💡 *Tip:* ${usedPrefix}list <category> for specific category\n`
    text += `📖 *Example:* ${usedPrefix}list group\n\n`
    text += `_Powered by NEXUS-MD_`
    
    await m.reply(text)
    
  } catch (e) {
    m.reply(`Error: ${e.message}`)
  }
}

handler.help = ['list [category]', 'commands']
handler.tags = ['main']
handler.command = ['list', 'listcmd', 'cmdlist', 'commands', 'cmd']
handler.desc = 'List all available commands'

export default handler
