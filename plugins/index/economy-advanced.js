/**
 * Advanced Economy Commands
 */
import {
  initUserEconomy, formatMoney, addMoney, removeMoney, canDo,
  getRemainingCooldown, formatTime, randomInt, CURRENCY
} from '../../lib/economy.js'

const SHOP_ITEMS = [
  { id: 'pickaxe', name: 'Iron Pickaxe', price: 5000, desc: 'Improves mining rewards', type: 'tool' },
  { id: 'rod', name: 'Pro Fishing Rod', price: 4000, desc: 'Catch better fish', type: 'tool' },
  { id: 'rifle', name: 'Hunting Rifle', price: 7500, desc: 'Better hunting success', type: 'tool' },
  { id: 'shield', name: 'Protection Shield', price: 10000, desc: 'Protects from being robbed once', type: 'defense' },
  { id: 'card_pack', name: 'Premium Card Pack', price: 2000, desc: 'Contains random anime cards', type: 'consumable' },
  { id: 'exp_boost', name: 'Double XP (1h)', price: 3000, desc: 'Double XP for 1 hour', type: 'boost' }
]

const MONTHLY_REWARD = 50000
const MONTHLY_COOLDOWN = 30 * 24 * 60 * 60 * 1000

let handler = async (m, { conn, args, usedPrefix, command }) => {
  const user = global.db.data.users[m.sender]
  const economy = initUserEconomy(user)
  if (!user.inventory) user.inventory = {}

  switch (command) {
    case 'rob': {
      let target = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null)
      if (!target) throw `*Usage:* ${usedPrefix}rob @user`
      if (target === m.sender) throw `❌ You can't rob yourself!`
      const targetUser = global.db.data.users[target]
      if (!targetUser) throw `❌ User not found!`
      const targetEconomy = initUserEconomy(targetUser)
      if (targetEconomy.wallet < 100) throw `❌ They are too poor to rob!`
      const ROB_COOLDOWN = 2 * 60 * 60 * 1000
      if (!canDo(economy.lastRob || 0, ROB_COOLDOWN)) {
        const remaining = getRemainingCooldown(economy.lastRob || 0, ROB_COOLDOWN)
        throw `⏳ You need to wait *${formatTime(remaining)}* before robbing again.`
      }
      economy.lastRob = Date.now()
      if (targetUser.inventory?.shield > 0) {
        targetUser.inventory.shield--
        throw `❌ You tried to rob @${target.split('@')[0]} but their *Protection Shield* blocked you!`
      }
      if (Math.random() > 0.5) {
        const stolen = Math.floor(targetEconomy.wallet * (Math.random() * 0.3 + 0.1))
        removeMoney(targetUser, stolen); addMoney(user, stolen)
        return m.reply(`💰 *ROBBERY SUCCESSFUL!*\n\nYou stole ${formatMoney(stolen)} from @${target.split('@')[0]}!`, null, { mentions: [target] })
      } else {
        const fine = Math.floor(economy.wallet * 0.1)
        removeMoney(user, fine)
        return m.reply(`🚔 *ROBBERY FAILED!*\n\nYou got caught and paid a fine of ${formatMoney(fine)}.`)
      }
    }
    case 'shop': {
      let text = `🛒 *NEXUS SHOP*\n\n`
      SHOP_ITEMS.forEach((item, i) => {
        text += `${i + 1}. *${item.name}* - ${formatMoney(item.price)}\n   _${item.desc}_\n   Command: \`${usedPrefix}buy ${item.id}\`\n\n`
      })
      return m.reply(text)
    }
    case 'buy': {
      const itemID = args[0]?.toLowerCase()
      const item = SHOP_ITEMS.find(i => i.id === itemID)
      if (!item) throw `❌ Item not found! Use \`${usedPrefix}shop\`.`
      if (economy.wallet < item.price) throw `❌ You need ${formatMoney(item.price)}.`
      removeMoney(user, item.price); user.inventory[item.id] = (user.inventory[item.id] || 0) + 1
      return m.reply(`✅ Successfully bought *${item.name}*!`)
    }
    case 'inventory':
    case 'inv': {
      let text = `🎒 *YOUR INVENTORY*\n\n`
      const items = Object.entries(user.inventory || {}).filter(([_, count]) => count > 0)
      if (items.length === 0) text += `_Your inventory is empty._`
      else items.forEach(([id, count]) => {
        const item = SHOP_ITEMS.find(i => i.id === id) || { name: id }
        text += `• *${item.name}*: ${count}\n`
      })
      return m.reply(text)
    }
    case 'monthly': {
      if (!canDo(economy.lastMonthly || 0, MONTHLY_COOLDOWN)) {
        const remaining = getRemainingCooldown(economy.lastMonthly || 0, MONTHLY_COOLDOWN)
        throw `⏳ Wait *${formatTime(remaining)}*.`
      }
      economy.lastMonthly = Date.now(); addMoney(user, MONTHLY_REWARD)
      return m.reply(`🎁 *MONTHLY REWARD:* ${formatMoney(MONTHLY_REWARD)}!`)
    }
    // Redirection to other plugins
    case 'withdraw': case 'deposit': case 'bank': return global.plugins['economy-bank.js'].call(conn, m, { conn, args, usedPrefix, command })
    case 'transfer': case 'pay': case 'send': return global.plugins['economy-pay.js'].call(conn, m, { conn, args, usedPrefix, command })
    case 'balance': case 'bal': return global.plugins['economy-balance.js'].call(conn, m, { conn, args, usedPrefix, command })
    case 'leaderboard': case 'lb': return global.plugins['economy-leaderboard.js'].call(conn, m, { conn, args, usedPrefix, command })
    case 'daily': return global.plugins['economy-daily.js'].call(conn, m, { conn, args, usedPrefix, command })
    case 'work': return global.plugins['economy-work.js'].call(conn, m, { conn, args, usedPrefix, command })
    case 'crime': return global.plugins['economy-crime.js'].call(conn, m, { conn, args, usedPrefix, command })
    case 'mine': return global.plugins['economy-mine.js'].call(conn, m, { conn, args, usedPrefix, command })
    case 'fish': return global.plugins['economy-fish.js'].call(conn, m, { conn, args, usedPrefix, command })
    case 'hunt': return global.plugins['economy-hunt.js'].call(conn, m, { conn, args, usedPrefix, command })
    case 'slots': return global.plugins['casino-slots.js'].call(conn, m, { conn, args, usedPrefix, command })
    case 'coinflip': return global.plugins['casino-coinflip.js'].call(conn, m, { conn, args, usedPrefix, command })
    case 'dice': return global.plugins['casino-dice.js'].call(conn, m, { conn, args, usedPrefix, command })
    case 'blackjack': case 'bj': return global.plugins['casino-blackjack.js'].call(conn, m, { conn, args, usedPrefix, command })
    case 'roulette': return global.plugins['casino-roulette.js'].call(conn, m, { conn, args, usedPrefix, command })
  }
}

handler.help = [
  'rob @user', 'withdraw <amount>', 'shop', 'inventory', 'monthly', 'transfer @user <amount>',
  'deposit <amount>', 'balance', 'leaderboard', 'daily', 'work', 'crime', 'mine', 'fish', 'hunt',
  'slots <amount>', 'coinflip <amount>', 'dice <amount>', 'blackjack <amount>', 'roulette <amount>'
]
handler.tags = ['economy']
handler.command = [
  'rob', 'withdraw', 'shop', 'buy', 'inventory', 'inv', 'monthly', 'transfer', 'deposit',
  'balance', 'bal', 'leaderboard', 'lb', 'daily', 'work', 'crime', 'mine', 'fish', 'hunt',
  'slots', 'coinflip', 'dice', 'blackjack', 'bj', 'roulette'
]

export default handler
