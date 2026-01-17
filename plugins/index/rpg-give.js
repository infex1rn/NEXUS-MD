/**
 * RPG Give Plugin - Allows owners to mint money and users to transfer it
 */
import {
  initUserEconomy,
  formatMoney,
  removeMoney,
  addMoney,
  CURRENCY
} from '../../lib/economy.js'

let handler = async (m, { conn, args, usedPrefix, command, isOwner }) => {
    const mentioned = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null)

    if (!mentioned) {
        return m.reply(`*Format:* ${usedPrefix + command} @user <amount>\n*Example:* ${usedPrefix + command} @user 1000`)
    }

    if (mentioned === m.sender && !isOwner) {
        return m.reply(`❌ You can't transfer money to yourself!`)
    }

    // Parse amount from args
    const amountArg = args.find(arg => !isNaN(parseInt(arg.replace(/[^0-9]/g, ''))))
    let amount = parseInt(amountArg?.replace(/[^0-9]/g, ''))

    if (!amount || amount <= 0) {
        return m.reply(`❌ Please specify a valid amount of coins to give.`)
    }

    // Check if target exists in database
    let receiver = global.db.data.users[mentioned]
    if (!receiver) {
        global.db.data.users[mentioned] = {
            warn: 0,
            registered: false,
            name: '',
            afk: -1,
            afkReason: '',
            banned: false,
            balance: 1000,
            bank: 0,
            exp: 0,
            lastClaim: 0,
            role: 'Novice',
        }
        receiver = global.db.data.users[mentioned]
    }

    if (isOwner) {
        // Minting Mode
        addMoney(receiver, amount)
        // Sync balance if it exists (no double adding)
        if (receiver && typeof receiver.balance === 'number') receiver.balance = receiver.economy.wallet

        m.reply(`✅ *MINT SUCCESS*\n\nSuccessfully minted *${formatMoney(amount)}* for *@${mentioned.split('@')[0]}*`, null, { mentions: [mentioned] })
    } else {
        // Transfer Mode
        const sender = global.db.data.users[m.sender]
        const senderEconomy = initUserEconomy(sender)

        if (senderEconomy.wallet < amount) {
            return m.reply(`❌ *Insufficient Funds!*\n\nYou only have ${formatMoney(senderEconomy.wallet)} in your wallet.`)
        }

        // Transfer tax (2%)
        const tax = Math.floor(amount * 0.02)
        const received = amount - tax

        removeMoney(sender, amount)
        addMoney(receiver, received)

        // Sync balance if they exist
        if (sender && typeof sender.balance === 'number') sender.balance = sender.economy.wallet
        if (receiver && typeof receiver.balance === 'number') receiver.balance = receiver.economy.wallet

        m.reply(`✅ *TRANSFER SUCCESS*\n\nSent *${formatMoney(received)}* to *@${mentioned.split('@')[0]}*\nTax (2%): ${formatMoney(tax)}`, null, { mentions: [mentioned] })
    }
}

handler.help = ['give @user <amount>']
handler.tags = ['economy']
handler.command = ['give', 'addmoney']

export default handler
