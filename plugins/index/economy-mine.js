/**
 * Economy Command: Mine
 * Mine for resources to sell
 */
import { 
  initUserEconomy, 
  formatMoney, 
  addMoney, 
  addExp,
  canDo, 
  getRemainingCooldown, 
  formatTime,
  pickWeighted,
  COOLDOWNS, 
  MINE_RESOURCES,
  CURRENCY 
} from '../../lib/economy.js'

let handler = async (m, { conn }) => {
  const user = global.db.data.users[m.sender]
  const economy = initUserEconomy(user)
  
  // Check cooldown
  if (!canDo(economy.lastMine, COOLDOWNS.mine)) {
    const remaining = getRemainingCooldown(economy.lastMine, COOLDOWNS.mine)
    return m.reply(`⏰ *Mining Cooldown*\n\nYour pickaxe needs to cool down!\n\n⏳ Next mine in: *${formatTime(remaining)}*`)
  }
  
  // Mine multiple resources (1-3)
  const resourceCount = Math.floor(Math.random() * 3) + 1
  const found = []
  let totalValue = 0
  
  for (let i = 0; i < resourceCount; i++) {
    const resource = pickWeighted(MINE_RESOURCES)
    found.push(resource)
    totalValue += resource.value
  }
  
  // XP gain
  const expGain = Math.floor(totalValue / 10)
  
  // Apply rewards
  addMoney(user, totalValue)
  const { leveledUp, level } = addExp(user, expGain)
  economy.lastMine = Date.now()
  
  const resourceList = found.map(r => `├ ${r.emoji} ${r.name}: ${formatMoney(r.value)}`).join('\n')
  
  let replyText = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  ⛏️ *MINING RESULTS*
╰━━━━━━━━━━━━━━━━━━━━━╯

You swung your pickaxe and found:

${resourceList}
└──────────────────

${CURRENCY.symbol} *Total Value:* +${formatMoney(totalValue)}
✨ *EXP:* +${expGain}

💵 *Wallet:* ${formatMoney(economy.wallet)}
`.trim()

  if (leveledUp) {
    replyText += `\n\n🎉 *LEVEL UP!* You are now level ${level}!`
  }
  
  // Rare find bonus
  const hasRare = found.some(r => r.name === 'Diamond' || r.name === 'Ruby')
  if (hasRare) {
    replyText += `\n\n💎 *RARE FIND!* You struck it rich!`
  }

  await m.reply(replyText)
}

handler.help = ['mine']
handler.tags = ['economy']
handler.command = ['mine', 'dig']
handler.desc = 'Mine for valuable resources'

export default handler
