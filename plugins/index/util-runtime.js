/**
 * Utility Command: Runtime
 * Show bot uptime and stats
 */
import os from 'os'

let handler = async (m) => {
  const uptime = process.uptime()
  const days = Math.floor(uptime / 86400)
  const hours = Math.floor((uptime % 86400) / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)
  const seconds = Math.floor(uptime % 60)
  
  const memTotal = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2)
  const memFree = (os.freemem() / 1024 / 1024 / 1024).toFixed(2)
  const memUsed = (memTotal - memFree).toFixed(2)
  
  const cpus = os.cpus()
  const cpuModel = cpus[0]?.model || 'Unknown'
  const cpuCount = cpus.length
  
  const message = `
⏱️ *BOT RUNTIME*

📊 *Uptime:*
${days}d ${hours}h ${minutes}m ${seconds}s

💻 *System:*
• Platform: ${os.platform()}
• Arch: ${os.arch()}
• Node: ${process.version}

🖥️ *CPU:*
• Model: ${cpuModel}
• Cores: ${cpuCount}

💾 *Memory:*
• Total: ${memTotal} GB
• Used: ${memUsed} GB
• Free: ${memFree} GB

🤖 *Bot:*
• Process: ${process.pid}
• Heap: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
`.trim()
  
  m.reply(message)
}

handler.help = ['runtime', 'uptime']
handler.tags = ['utility']
handler.command = ['runtime', 'uptime', 'run']
handler.desc = 'Show bot uptime and system statistics'

export default handler
