/**
 * Economy Command: Pay / Transfer
 * Transfer money to another user
 */
import { 
  initUserEconomy, 
  formatMoney, 
  removeMoney, 
  addMoney,
  CURRENCY 
} from '../../lib/economy.js'

let handler = async (m, { conn, args, usedPrefix, command }) => {
  // Check if user is mentioned
  const mentioned = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null)
  
  if (!mentioned) {
    return m.reply(`*Usage:* ${usedPrefix}${command} @user <amount>\n\nExample: ${usedPrefix}${command} @user 500`)
  }
  
  if (mentioned === m.sender) {
    return m.reply(`❌ You can't transfer money to yourself!`)
  }
  
  // Get amount
  const amountArg = args.find(arg => !isNaN(parseInt(arg)))
  const amount = parseInt(amountArg)
  
  if (!amount || amount <= 0) {
    return m.reply(`❌ Please specify a valid amount!\n\nExample: ${usedPrefix}${command} @user 500`)
  }
  
  // Initialize users
  const sender = global.db.data.users[m.sender]
  const receiver = global.db.data.users[mentioned]
  
  if (!receiver) {
    return m.reply(`❌ User not found in database!`)
  }
  
  const senderEconomy = initUserEconomy(sender)
  const receiverEconomy = initUserEconomy(receiver)
  
  // Check if sender has enough
  if (senderEconomy.wallet < amount) {
    return m.reply(`❌ *Insufficient Funds!*\n\nYou only have ${formatMoney(senderEconomy.wallet)} in your wallet.`)
  }
  
  // Transfer tax (2%)
  const tax = Math.floor(amount * 0.02)
  const received = amount - tax
  
  // Perform transfer
  removeMoney(sender, amount)
  addMoney(receiver, received)
  
  const replyText = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  💸 *TRANSFER SUCCESS*
╰━━━━━━━━━━━━━━━━━━━━━╯

*From:* @${m.sender.split('@')[0]}
*To:* @${mentioned.split('@')[0]}

${CURRENCY.symbol} *Amount:* ${formatMoney(amount)}
💰 *Tax (2%):* ${formatMoney(tax)}
✅ *Received:* ${formatMoney(received)}

📊 *Your Balance:* ${formatMoney(senderEconomy.wallet)}
`.trim()

  await m.reply(replyText, null, { mentions: [m.sender, mentioned] })
}

handler.help = ['pay @user <amount>', 'transfer @user <amount>']
handler.tags = ['economy']
handler.command = ['pay', 'transfer', 'send']
handler.desc = 'Transfer money to another user'

export default handler
