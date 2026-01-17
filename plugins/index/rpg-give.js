/**
 * RPG Give Plugin - Allows owners to give coins to users
 */

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) throw `*Format:* ${usedPrefix + command} <amount> @user\n*Example:* ${usedPrefix + command} 1000 @1234567890`

    // Get targeted user (mention, quoted message, or raw number)
    let _user = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null

    // If no mention or quote, try to parse from text
    if (!_user) {
        let jid = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
        if (jid.length > 15) _user = jid
    }

    if (!_user) throw `*Error:* Please mention a user, quote their message, or provide their phone number.`

    // Parse amount
    let amount = text.match(/\d+/g)
    if (!amount) throw `*Error:* Please specify the amount of coins to give.`
    amount = parseInt(amount[0])

    // Check if user exists in database
    let user = global.db.data.users[_user]
    if (!user) {
        // Initialize user if they don't exist but we're giving them money
        global.db.data.users[_user] = {
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
        user = global.db.data.users[_user]
    }

    // Add balance
    user.balance += amount

    m.reply(`✅ *RPG GIVE*\n\nSuccessfully gave *${amount.toLocaleString()}* coins to *@${_user.split('@')[0]}*\n\n*New Balance:* ${user.balance.toLocaleString()}`, null, { mentions: [_user] })
}

handler.help = ['give <amount> @user']
handler.tags = ['owner']
handler.command = ['give', 'addmoney']
handler.owner = true

export default handler
