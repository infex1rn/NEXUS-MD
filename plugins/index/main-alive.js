/**
 * Main Command: Alive
 * Check if bot is online
 */
import { formatMessage } from '../../lib/simple.js'

let handler = async (m, { conn }) => {
  const uptime = formatUptime(process.uptime())
  const memUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
  const totalPlugins = Object.keys(global.plugins || {}).length
  
  const body = `⏱️ *Uptime:* ${uptime}
💾 *Memory:* ${memUsed} MB
🔌 *Plugins:* ${totalPlugins}
📅 *Date:* ${new Date().toLocaleDateString()}
⏰ *Time:* ${new Date().toLocaleTimeString()}

📋 Type *.menu* for commands`

  const message = formatMessage('NEXUS-MD IS ALIVE', body, `Running on Node.js ${process.version}`)
  
  await m.reply(message)
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  let result = []
  if (days > 0) result.push(`${days}d`)
  if (hours > 0) result.push(`${hours}h`)
  if (minutes > 0) result.push(`${minutes}m`)
  result.push(`${secs}s`)
  
  return result.join(' ')
}

handler.help = ['alive']
handler.tags = ['main']
handler.command = ['alive', 'bot', 'status']
handler.desc = 'Check if bot is online and running'

export default handler
