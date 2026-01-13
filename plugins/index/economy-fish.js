/**
 * Economy Command: Fish
 * Fish for catches to sell
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
  FISH_TYPES,
  CURRENCY 
} from '../../lib/economy.js'

let handler = async (m, { conn }) => {
  const user = global.db.data.users[m.sender]
  const economy = initUserEconomy(user)
  
  // Check cooldown
  if (!canDo(economy.lastFish, COOLDOWNS.fish)) {
    const remaining = getRemainingCooldown(economy.lastFish, COOLDOWNS.fish)
    return m.reply(`⏰ *Fishing Cooldown*\n\nThe fish need time to return!\n\n⏳ Next fish in: *${formatTime(remaining)}*`)
  }
  
  // Catch fish (1-2)
  const catchCount = Math.floor(Math.random() * 2) + 1
  const caught = []
  let totalValue = 0
  
  for (let i = 0; i < catchCount; i++) {
    const fish = pickWeighted(FISH_TYPES)
    caught.push(fish)
    totalValue += fish.value
  }
  
  // XP gain
  const expGain = Math.floor(totalValue / 8)
  
  // Apply rewards
  addMoney(user, totalValue)
  const { leveledUp, level } = addExp(user, expGain)
  economy.lastFish = Date.now()
  
  const catchList = caught.map(f => `├ ${f.emoji} ${f.name}: ${formatMoney(f.value)}`).join('\n')
  
  let replyText = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🎣 *FISHING RESULTS*
╰━━━━━━━━━━━━━━━━━━━━━╯

You cast your line and caught:

${catchList}
└──────────────────

${CURRENCY.symbol} *Total Value:* +${formatMoney(totalValue)}
✨ *EXP:* +${expGain}

💵 *Wallet:* ${formatMoney(economy.wallet)}
`.trim()

  if (leveledUp) {
    replyText += `\n\n🎉 *LEVEL UP!* You are now level ${level}!`
  }
  
  // Golden fish bonus
  const hasGolden = caught.some(f => f.name === 'Golden Fish')
  if (hasGolden) {
    replyText += `\n\n✨ *LEGENDARY CATCH!* The Golden Fish grants a wish!`
    const bonus = 250
    addMoney(user, bonus)
    replyText += `\n🎁 *Bonus:* +${formatMoney(bonus)}`
  }

  await m.reply(replyText)
}

handler.help = ['fish']
handler.tags = ['economy']
handler.command = ['fish', 'fishing']
handler.desc = 'Go fishing for catches'

export default handler
