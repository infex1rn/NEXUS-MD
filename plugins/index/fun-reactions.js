/**
 * Fun Command: Slap/Hug/Pat
 * Fun anime reaction GIFs
 */
import fetch from 'node-fetch'

let handler = async (m, { conn, command, text }) => {
  const who = m.quoted ? m.quoted.sender : m.mentionedJid?.[0]
  
  const actions = {
    slap: { text: 'slapped', emoji: '👋' },
    hug: { text: 'hugged', emoji: '🤗' },
    pat: { text: 'patted', emoji: '🫳' },
    kiss: { text: 'kissed', emoji: '😘' },
    punch: { text: 'punched', emoji: '👊' },
    cuddle: { text: 'cuddled', emoji: '🥰' },
    poke: { text: 'poked', emoji: '👉' },
    bite: { text: 'bit', emoji: '😬' },
    wave: { text: 'waved at', emoji: '👋' },
    wink: { text: 'winked at', emoji: '😉' }
  }
  
  const action = actions[command.toLowerCase()]
  if (!action) return
  
  try {
    let message = `${action.emoji} `
    
    if (who) {
      message += `*@${m.sender.split('@')[0]}* ${action.text} *@${who.split('@')[0]}*!`
      
      await conn.sendMessage(m.chat, {
        text: message,
        mentions: [m.sender, who]
      }, { quoted: m })
    } else {
      message += `*@${m.sender.split('@')[0]}* wants to ${command} someone!`
      
      await conn.sendMessage(m.chat, {
        text: message + '\n\n_Tag someone to use this command!_',
        mentions: [m.sender]
      }, { quoted: m })
    }
    
  } catch (e) {
    m.reply(`❌ Error: ${e.message}`)
  }
}

handler.help = ['slap @user', 'hug @user', 'pat @user', 'kiss @user']
handler.tags = ['fun']
handler.command = ['slap', 'hug', 'pat', 'kiss', 'punch', 'cuddle', 'poke', 'bite', 'wave', 'wink']
handler.desc = 'Fun reaction commands - slap, hug, pat someone!'

export default handler
