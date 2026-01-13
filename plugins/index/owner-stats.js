/**
 * Owner Command: Stats
 * Show bot statistics
 */
let handler = async (m, { conn }) => {
  const stats = global.db.data.stats || {}
  const users = Object.keys(global.db.data.users || {}).length
  const chats = Object.keys(global.db.data.chats || {}).length
  const plugins = Object.keys(global.plugins || {}).length
  
  // Calculate command usage stats
  let totalCommands = 0
  let successCommands = 0
  const topCommands = []
  
  for (const [cmd, stat] of Object.entries(stats)) {
    totalCommands += stat.total || 0
    successCommands += stat.success || 0
    topCommands.push({ name: cmd, count: stat.total || 0 })
  }
  
  topCommands.sort((a, b) => b.count - a.count)
  const top5 = topCommands.slice(0, 5)
  
  const uptime = process.uptime()
  const days = Math.floor(uptime / 86400)
  const hours = Math.floor((uptime % 86400) / 3600)
  const mins = Math.floor((uptime % 3600) / 60)
  
  const memUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
  
  let message = `
📊 *BOT STATISTICS*

👥 *Users:* ${users}
💬 *Chats:* ${chats}
🔌 *Plugins:* ${plugins}

⏱️ *Uptime:* ${days}d ${hours}h ${mins}m
💾 *Memory:* ${memUsed} MB

📈 *Command Usage:*
• Total: ${totalCommands}
• Success: ${successCommands}
• Success Rate: ${totalCommands > 0 ? ((successCommands / totalCommands) * 100).toFixed(1) : 0}%

🏆 *Top Commands:*
${top5.map((c, i) => `${i + 1}. ${c.name.replace('.js', '')} (${c.count})`).join('\n') || 'No data yet'}
`.trim()
  
  m.reply(message)
}

handler.help = ['stats', 'botstats']
handler.tags = ['owner']
handler.command = ['stats', 'botstats', 'stat']
handler.desc = 'Show bot statistics and usage data'
handler.owner = true

export default handler
