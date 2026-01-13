/**
 * Main Command: Ping
 * Check bot response time
 */
let handler = async (m) => {
  const start = Date.now()
  
  const msg = await m.reply('🏓 *Pinging...*')
  
  const end = Date.now()
  const responseTime = end - start
  
  const status = responseTime < 100 ? '🟢 Excellent' 
    : responseTime < 300 ? '🟡 Good' 
    : responseTime < 500 ? '🟠 Average' 
    : '🔴 Slow'
  
  const uptime = formatUptime(process.uptime())
  const memUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
  
  await m.reply(`
🏓 *Pong!*

⚡ *Response:* ${responseTime}ms
📊 *Status:* ${status}
⏱️ *Uptime:* ${uptime}
💾 *Memory:* ${memUsed} MB
`.trim())
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

handler.help = ['ping']
handler.tags = ['main']
handler.command = ['ping', 'speed', 'p']
handler.desc = 'Check bot response time'

export default handler
