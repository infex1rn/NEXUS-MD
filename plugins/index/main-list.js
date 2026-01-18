/**
 * Main Command: List Commands
 * Display all available commands in categories
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { formatMessage } from '../../lib/simple.js'
import { toMono, toSmallCaps } from '../../lib/font.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const tags = {
  'main': 'Main',
  'group': 'Group',
  'downloader': 'Downloader',
  'sticker': 'Sticker',
  'tools': 'Tools',
  'fun': 'Fun',
  'utility': 'Utility',
  'owner': 'Owner',
  'config': 'Config',
  'other': 'Other'
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
    
    let text = `╭═══ ${global.botname} ═══⊷\n`
    text += `┃❃ 📋 Total: ${Object.values(commandsMap).flat().length} commands\n`
    text += `┃❃ ⌨️ Prefix: ${usedPrefix}\n`
    text += `╰═════════════════⊷\n\n`
    
    const sortOrder = ['main', 'group', 'downloader', 'sticker', 'tools', 'fun', 'utility', 'config', 'owner', 'other']
    
    for (const tag of sortOrder) {
      if (filterTag && filterTag !== tag) continue
      
      const cmds = commandsMap[tag]
      if (!cmds || cmds.length === 0) continue
      
      const name = tags[tag] || tag
      
      let categoryBody = ''
      for (const { cmd } of cmds) {
        categoryBody += `${toMono(cmd.toUpperCase())}\n`
      }
      
      text += formatMessage(toSmallCaps(name), categoryBody.trim()) + '\n\n'
    }
    
    text += `\n💡 Tip: ${usedPrefix}list <category> for specific category\n`
    text += `📖 Example: ${usedPrefix}list group\n\n`
    text += `_Powered by ${global.botname}_`
    
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
