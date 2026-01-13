/**
 * Owner Command: Eval/Exec
 * Execute JavaScript code
 */
import { format } from 'util'

let handler = async (m, { conn, text, usedPrefix, noPrefix }) => {
  let _return
  let _text = (/^=/.test(usedPrefix) ? 'return ' : '') + noPrefix
  
  try {
    // Create execution context
    const print = (...args) => {
      const output = format(...args)
      conn.reply(m.chat, output, m)
    }
    
    // Execute the code
    let exec = new (async () => {}).constructor(
      'print', 'm', 'conn', 'require', 'args', 'process',
      _text
    )
    
    _return = await exec.call(conn, print, m, conn, null, [], process)
    
  } catch (e) {
    _return = e
  } finally {
    const output = format(_return)
    if (output.length > 4000) {
      // If output is too long, truncate
      conn.reply(m.chat, output.slice(0, 4000) + '\n\n... (truncated)', m)
    } else {
      conn.reply(m.chat, output || 'undefined', m)
    }
  }
}

handler.customPrefix = /^=?> /
handler.command = new RegExp()
handler.rowner = true

export default handler
