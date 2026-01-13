/**
 * Card Command: Gacha / Pull
 * Pull anime cards using coins
 */
import { 
  initUserCards, 
  pullCard, 
  multiPull, 
  RARITIES, 
  GACHA_COSTS,
  formatCard,
  isAnimatedCard,
  getCardImage
} from '../../lib/cards.js'
import { initUserEconomy, formatMoney, removeMoney } from '../../lib/economy.js'
import { generateSerial } from '../../lib/cardDrops.js'

let handler = async (m, { conn, args, usedPrefix, command }) => {
  const user = global.db.data.users[m.sender]
  const economy = initUserEconomy(user)
  const cards = initUserCards(user)
  
  const pullType = args[0]?.toLowerCase() || 'single'
  
  let cost, pullCount
  
  switch (pullType) {
    case '10':
    case 'multi':
    case 'multi10':
      cost = GACHA_COSTS.multi10
      pullCount = 10
      break
    case '50':
    case 'multi50':
      cost = GACHA_COSTS.multi50
      pullCount = 50
      break
    default:
      cost = GACHA_COSTS.single
      pullCount = 1
  }
  
  // Show gacha info if no args
  if (args[0] === 'info' || args[0] === 'rates') {
    let ratesText = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🎰 *ANIME GACHA RATES*
╰━━━━━━━━━━━━━━━━━━━━━╯

*Pull Costs:*
├ Single: 💰 ${GACHA_COSTS.single}
├ Multi 10: 💰 ${GACHA_COSTS.multi10} (10% off!)
└ Multi 50: 💰 ${GACHA_COSTS.multi50} (20% off!)

*Rarity Rates:*
`
    for (const [key, rarity] of Object.entries(RARITIES)) {
      const animatedTag = rarity.animated ? '🎬' : '🖼️'
      const specialTag = rarity.special ? '👑' : ''
      ratesText += `├ ${rarity.emoji} ${rarity.name}: ${rarity.chance}% ${animatedTag}${specialTag}\n`
    }
    
    ratesText += `
*Card Types:*
├ 🖼️ Static - Common, Uncommon, Rare
├ 🎬 Animated GIF - Epic, Legendary
└ 👑 Special Animated - Mythic (Highest!)

*Pity System:*
├ 50 pulls: Guaranteed Epic+
└ 100 pulls: Guaranteed Legendary+

📊 *Your Pity:* ${cards.pity}/100
💰 *Your Balance:* ${formatMoney(economy.wallet)}
`.trim()
    
    return m.reply(ratesText)
  }
  
  // Check balance
  if (economy.wallet < cost) {
    return m.reply(`
❌ *Insufficient Funds!*

Cost: ${formatMoney(cost)}
Your Balance: ${formatMoney(economy.wallet)}

Earn money with: .work, .daily, .mine, .fish, .hunt
`.trim())
  }
  
  // Deduct cost
  removeMoney(user, cost)
  
  // Pull cards
  const results = []
  
  for (let i = 0; i < pullCount; i++) {
    const result = pullCard(user, i < pullCount - 1)
    // Add serial number to the card in collection
    const lastCard = cards.collection[cards.collection.length - 1]
    lastCard.serial = generateSerial()
    lastCard.obtainedFrom = 'gacha'
    result.serial = lastCard.serial
    results.push(result)
  }
  
  // Sort by rarity for display
  const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common']
  results.sort((a, b) => rarityOrder.indexOf(a.card.rarity) - rarityOrder.indexOf(b.card.rarity))
  
  let replyText = `
╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🎰 *ANIME GACHA RESULTS*
┃  ${pullCount}x Pull
╰━━━━━━━━━━━━━━━━━━━━━╯

💰 *Cost:* ${formatMoney(cost)}

`

  // Count by rarity
  const counts = {}
  for (const r of results) {
    counts[r.card.rarity] = (counts[r.card.rarity] || 0) + 1
  }
  
  // Show summary for multi-pulls
  if (pullCount > 1) {
    replyText += `📊 *Summary:*\n`
    for (const [rarity, count] of Object.entries(counts).sort((a, b) => 
      rarityOrder.indexOf(a[0]) - rarityOrder.indexOf(b[0])
    )) {
      const r = RARITIES[rarity]
      const animatedTag = r.animated ? '🎬' : ''
      replyText += `├ ${r.emoji} ${r.name}: ${count} ${animatedTag}\n`
    }
    replyText += `\n`
  }
  
  // Show top cards (limit display for large pulls)
  const displayLimit = pullCount > 10 ? 10 : pullCount
  const topCards = results.slice(0, displayLimit)
  
  replyText += `🎴 *Anime Cards Obtained:*\n`
  
  for (const result of topCards) {
    const isNew = result.isNew ? '✨ NEW!' : ''
    const animatedTag = result.rarity.animated ? '🎬' : ''
    const specialTag = result.rarity.special ? '👑' : ''
    replyText += `\n${result.rarity.emoji} ${specialTag}*${result.card.name}* ${animatedTag} ${isNew}\n`
    replyText += `├ 📺 ${result.card.anime || 'Unknown'}\n`
    replyText += `└ \`${result.serial}\` | ⚔️ ${result.card.power}\n`
  }
  
  if (results.length > displayLimit) {
    replyText += `\n_...and ${results.length - displayLimit} more cards!_\n`
  }
  
  replyText += `
━━━━━━━━━━━━━━━━━━━━━
📈 *Pity:* ${cards.pity}/100
💰 *Balance:* ${formatMoney(economy.wallet)}
🎴 *Total Cards:* ${cards.collection.length}
`.trim()

  // Check for rare pulls and show image for best card
  const bestCard = results[0]
  const hasLegendary = results.some(r => ['legendary', 'mythic'].includes(r.card.rarity))
  const hasMythic = results.some(r => r.card.rarity === 'mythic')
  
  if (hasMythic) {
    replyText += `\n\n👑🎉 *MYTHIC PULL!!!* The rarest tier! 🎉👑`
  } else if (hasLegendary) {
    replyText += `\n\n🎉 *LEGENDARY PULL!* Amazing luck! 🎉`
  }

  // Send best card image for single pulls or rare+ pulls
  if (pullCount === 1 || hasLegendary) {
    const cardToShow = results.find(r => ['mythic', 'legendary', 'epic'].includes(r.card.rarity)) || results[0]
    const imageUrl = getCardImage(cardToShow.card)
    
    if (imageUrl && !imageUrl.includes('placeholder')) {
      try {
        await conn.sendMessage(m.chat, {
          image: { url: imageUrl },
          caption: replyText
        }, { quoted: m })
        return
      } catch (e) {
        // If image fails, send text only
      }
    }
  }
  
  await m.reply(replyText)
}

handler.help = ['gacha', 'gacha 10', 'gacha 50', 'gacha info']
handler.tags = ['cards']
handler.command = ['gacha', 'pull', 'summon', 'draw']
handler.desc = 'Pull anime cards using coins'

export default handler
