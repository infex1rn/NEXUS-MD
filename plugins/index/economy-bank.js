/**
 * Economy Command: Bank
 * Deposit and withdraw from bank
 */
import { 
  initUserEconomy, 
  formatMoney, 
  deposit, 
  withdraw,
  CURRENCY 
} from '../../lib/economy.js'

let handler = async (m, { conn, args, usedPrefix, command }) => {
  const user = global.db.data.users[m.sender]
  const economy = initUserEconomy(user)
  
  const action = args[0]?.toLowerCase()
  const amountArg = args[1]
  
  // Show bank status if no action
  if (!action || !['deposit', 'dep', 'withdraw', 'wd', 'with'].includes(action)) {
    return m.reply(`
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🏦 *NEXUS BANK*
╰━━━━━━━━━━━━━━━━━━━━━╯

💵 *Wallet:* ${formatMoney(economy.wallet)}
🏦 *Bank:* ${formatMoney(economy.bank)}

*Commands:*
├ ${usedPrefix}bank deposit <amount/all>
└ ${usedPrefix}bank withdraw <amount/all>

_Bank protects your money from theft!_
`.trim())
  }
  
  // Parse amount
  let amount
  if (amountArg === 'all' || amountArg === 'max') {
    amount = action.startsWith('dep') ? economy.wallet : economy.bank
  } else {
    amount = parseInt(amountArg)
  }
  
  if (!amount || amount <= 0) {
    return m.reply(`❌ Please specify a valid amount!\n\nExample: ${usedPrefix}bank ${action} 1000`)
  }
  
  if (action === 'deposit' || action === 'dep') {
    // Deposit to bank
    if (economy.wallet < amount) {
      return m.reply(`❌ *Insufficient Funds!*\n\nYou only have ${formatMoney(economy.wallet)} in your wallet.`)
    }
    
    deposit(user, amount)
    
    return m.reply(`
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🏦 *DEPOSIT SUCCESS*
╰━━━━━━━━━━━━━━━━━━━━━╯

${CURRENCY.symbol} *Deposited:* ${formatMoney(amount)}

💵 *Wallet:* ${formatMoney(economy.wallet)}
🏦 *Bank:* ${formatMoney(economy.bank)}
`.trim())
  } else {
    // Withdraw from bank
    if (economy.bank < amount) {
      return m.reply(`❌ *Insufficient Bank Balance!*\n\nYou only have ${formatMoney(economy.bank)} in the bank.`)
    }
    
    withdraw(user, amount)
    
    return m.reply(`
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🏦 *WITHDRAWAL SUCCESS*
╰━━━━━━━━━━━━━━━━━━━━━╯

${CURRENCY.symbol} *Withdrawn:* ${formatMoney(amount)}

💵 *Wallet:* ${formatMoney(economy.wallet)}
🏦 *Bank:* ${formatMoney(economy.bank)}
`.trim())
  }
}

handler.help = ['bank deposit <amount>', 'bank withdraw <amount>']
handler.tags = ['economy']
handler.command = ['bank', 'deposit', 'withdraw', 'dep', 'wd']
handler.desc = 'Manage your bank account'

export default handler
