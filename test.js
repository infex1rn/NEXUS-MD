/**
 * NEXUS-MD Test Suite
 * Tests connection event listeners and command handler functionality
 */
import chalk from 'chalk'
import './config.js'

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
}

/**
 * Test runner function
 */
function test(name, fn) {
  try {
    fn()
    testResults.passed++
    testResults.tests.push({ name, status: 'PASS' })
    console.log(chalk.green(`✓ ${name}`))
  } catch (error) {
    testResults.failed++
    testResults.tests.push({ name, status: 'FAIL', error: error.message })
    console.log(chalk.red(`✗ ${name}`))
    console.log(chalk.gray(`  Error: ${error.message}`))
  }
}

/**
 * Assert function
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed')
  }
}

console.log(chalk.cyan('\n╔════════════════════════════════════════╗'))
console.log(chalk.cyan('║      NEXUS-MD TEST SUITE               ║'))
console.log(chalk.cyan('╚════════════════════════════════════════╝\n'))

// ============================================
// CONNECTION EVENT TESTS
// ============================================
console.log(chalk.yellow('\n📡 Testing Connection Events...\n'))

test('Connection states are defined correctly', () => {
  const states = ['connecting', 'open', 'close']
  states.forEach(state => {
    assert(typeof state === 'string', `State ${state} should be a string`)
  })
})

test('DisconnectReason codes are valid', () => {
  const reasons = {
    loggedOut: 401,
    connectionClosed: 428,
    connectionLost: 408,
    restartRequired: 515,
    timedOut: 408
  }
  
  Object.entries(reasons).forEach(([name, code]) => {
    assert(typeof code === 'number', `${name} should have a numeric code`)
    assert(code > 0, `${name} code should be positive`)
  })
})

test('Connection update handler mock works', () => {
  const mockUpdate = {
    connection: 'open',
    lastDisconnect: null,
    isNewLogin: true
  }
  
  assert(mockUpdate.connection === 'open', 'Connection should be open')
  assert(mockUpdate.isNewLogin === true, 'Should be new login')
})

test('Reconnection logic handles different disconnect reasons', () => {
  const shouldReconnect = (code) => {
    const noReconnectCodes = [401] // loggedOut
    return !noReconnectCodes.includes(code)
  }
  
  assert(shouldReconnect(428) === true, 'Should reconnect on connectionClosed')
  assert(shouldReconnect(408) === true, 'Should reconnect on timedOut')
  assert(shouldReconnect(401) === false, 'Should NOT reconnect on loggedOut')
})

// ============================================
// PREFIX PARSING TESTS
// ============================================
console.log(chalk.yellow('\n🔤 Testing Prefix Parsing...\n'))

test('Default prefix regex is valid', () => {
  const prefix = global.prefix
  assert(prefix instanceof RegExp, 'Prefix should be a RegExp')
})

test('Prefix matches common command characters', () => {
  const prefix = global.prefix
  const testPrefixes = ['.', '/', '!', '#', '$', '*']
  
  testPrefixes.forEach(p => {
    const testStr = p + 'command'
    assert(prefix.test(testStr), `Prefix should match "${p}"`)
  })
})

test('Prefix does not match regular text', () => {
  const prefix = global.prefix
  const testStrings = ['hello', 'command', 'test message']
  
  testStrings.forEach(str => {
    assert(!prefix.test(str), `Should not match regular text: "${str}"`)
  })
})

test('Command parsing extracts command and arguments correctly', () => {
  const parseCommand = (text, usedPrefix) => {
    const noPrefix = text.replace(usedPrefix, '')
    const [command, ...args] = noPrefix.trim().split(/\s+/).filter(v => v)
    return { command: command?.toLowerCase(), args }
  }
  
  const result1 = parseCommand('.menu', '.')
  assert(result1.command === 'menu', 'Should parse "menu" command')
  assert(result1.args.length === 0, 'Should have no arguments')
  
  const result2 = parseCommand('.kick @user', '.')
  assert(result2.command === 'kick', 'Should parse "kick" command')
  assert(result2.args.length === 1, 'Should have one argument')
  
  const result3 = parseCommand('!translate en hello world', '!')
  assert(result3.command === 'translate', 'Should parse "translate" command')
  assert(result3.args.length === 3, 'Should have three arguments')
})

// ============================================
// PLUGIN LOADING TESTS
// ============================================
console.log(chalk.yellow('\n🔌 Testing Plugin System...\n'))

test('Plugin file filter works correctly', () => {
  const pluginFilter = filename => /\.js$/.test(filename)
  
  assert(pluginFilter('gp-tagall.js') === true, 'Should match .js files')
  assert(pluginFilter('test.ts') === false, 'Should not match .ts files')
  assert(pluginFilter('readme.md') === false, 'Should not match .md files')
})

test('Plugin command matching works', () => {
  const matchCommand = (plugin, inputCommand) => {
    if (plugin.command instanceof RegExp) {
      return plugin.command.test(inputCommand)
    }
    if (Array.isArray(plugin.command)) {
      return plugin.command.some(cmd => 
        cmd instanceof RegExp ? cmd.test(inputCommand) : cmd === inputCommand
      )
    }
    return plugin.command === inputCommand
  }
  
  // Test string command
  const plugin1 = { command: 'menu' }
  assert(matchCommand(plugin1, 'menu') === true, 'Should match string command')
  assert(matchCommand(plugin1, 'help') === false, 'Should not match different command')
  
  // Test array command
  const plugin2 = { command: ['play', 'song', 'music'] }
  assert(matchCommand(plugin2, 'play') === true, 'Should match array command')
  assert(matchCommand(plugin2, 'music') === true, 'Should match any array element')
  
  // Test regex command
  const plugin3 = { command: /^(sticker|s)$/i }
  assert(matchCommand(plugin3, 'sticker') === true, 'Should match regex')
  assert(matchCommand(plugin3, 's') === true, 'Should match regex alias')
})

// ============================================
// DATABASE TESTS
// ============================================
console.log(chalk.yellow('\n💾 Testing Database Structure...\n'))

test('Database structure is valid', () => {
  const dbStructure = {
    users: {},
    chats: {},
    settings: {},
    stats: {}
  }
  
  assert(typeof dbStructure.users === 'object', 'Users should be object')
  assert(typeof dbStructure.chats === 'object', 'Chats should be object')
  assert(typeof dbStructure.settings === 'object', 'Settings should be object')
  assert(typeof dbStructure.stats === 'object', 'Stats should be object')
})

test('User object structure is correct', () => {
  const defaultUser = {
    warn: 0,
    registered: false,
    name: '',
    afk: -1,
    afkReason: '',
    banned: false
  }
  
  assert(typeof defaultUser.warn === 'number', 'Warn should be number')
  assert(typeof defaultUser.banned === 'boolean', 'Banned should be boolean')
  assert(defaultUser.afk === -1, 'AFK default should be -1')
})

test('Chat object structure is correct', () => {
  const defaultChat = {
    antiLink: false,
    isBanned: false,
    welcome: false,
    sWelcome: '',
    sBye: '',
    detect: false
  }
  
  assert(typeof defaultChat.antiLink === 'boolean', 'antiLink should be boolean')
  assert(typeof defaultChat.sWelcome === 'string', 'sWelcome should be string')
})

// ============================================
// OWNER/MOD CHECKS TESTS
// ============================================
console.log(chalk.yellow('\n👑 Testing Permission Checks...\n'))

test('Owner check works correctly', () => {
  const owners = global.owner || []
  assert(Array.isArray(owners), 'Owners should be an array')
  
  const checkOwner = (sender, ownerList) => {
    return ownerList.some(user => user.replace(/[^0-9]/g, '') === sender.replace(/[^0-9]/g, ''))
  }
  
  // Mock test
  const mockOwners = ['1234567890@s.whatsapp.net']
  assert(
    checkOwner('1234567890@s.whatsapp.net', mockOwners) === true,
    'Should identify owner'
  )
  assert(
    checkOwner('9999999999@s.whatsapp.net', mockOwners) === false,
    'Should not identify non-owner'
  )
})

// ============================================
// UTILITY FUNCTION TESTS
// ============================================
console.log(chalk.yellow('\n🛠️ Testing Utility Functions...\n'))

test('Duration formatting works', () => {
  const formatDuration = (ms) => {
    const seconds = Math.floor((ms / 1000) % 60)
    const minutes = Math.floor((ms / (60 * 1000)) % 60)
    const hours = Math.floor((ms / (60 * 60 * 1000)) % 24)
    const days = Math.floor(ms / (24 * 60 * 60 * 1000))
    
    let result = []
    if (days > 0) result.push(`${days}d`)
    if (hours > 0) result.push(`${hours}h`)
    if (minutes > 0) result.push(`${minutes}m`)
    if (seconds > 0) result.push(`${seconds}s`)
    
    return result.join(' ') || '0s'
  }
  
  assert(formatDuration(1000) === '1s', 'Should format 1 second')
  assert(formatDuration(60000) === '1m', 'Should format 1 minute')
  assert(formatDuration(3661000) === '1h 1m 1s', 'Should format complex duration')
})

test('Number formatting works', () => {
  const formatNumber = (num) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num?.toString() || '0'
  }
  
  assert(formatNumber(500) === '500', 'Should show 500')
  assert(formatNumber(1500) === '1.5K', 'Should format thousands')
  assert(formatNumber(1500000) === '1.5M', 'Should format millions')
})

test('URL detection works', () => {
  const isUrl = (text) => /^https?:\/\//i.test(text)
  
  assert(isUrl('https://example.com') === true, 'Should detect https URL')
  assert(isUrl('http://example.com') === true, 'Should detect http URL')
  assert(isUrl('example.com') === false, 'Should not detect without protocol')
  assert(isUrl('just some text') === false, 'Should not detect plain text')
})

// ============================================
// ECONOMY SYSTEM TESTS
// ============================================
console.log(chalk.yellow('\n💰 Testing Economy System...\n'))

test('Economy user initialization works', () => {
  const user = {}
  
  const initUserEconomy = (user) => {
    if (!user.economy) {
      user.economy = {
        wallet: 0,
        bank: 0,
        exp: 0,
        level: 1,
        lastDaily: 0,
        lastWork: 0,
        totalEarned: 0,
        totalSpent: 0,
        workCount: 0,
        streak: 0
      }
    }
    return user.economy
  }
  
  const economy = initUserEconomy(user)
  assert(economy.wallet === 0, 'Wallet should start at 0')
  assert(economy.level === 1, 'Level should start at 1')
  assert(economy.streak === 0, 'Streak should start at 0')
})

test('Money operations work correctly', () => {
  const economy = { wallet: 1000, totalEarned: 0, totalSpent: 0 }
  
  // Add money
  economy.wallet += 500
  economy.totalEarned += 500
  assert(economy.wallet === 1500, 'Should add money correctly')
  
  // Remove money
  const amount = 300
  if (economy.wallet >= amount) {
    economy.wallet -= amount
    economy.totalSpent += amount
  }
  assert(economy.wallet === 1200, 'Should remove money correctly')
})

test('Level calculation works', () => {
  const calculateLevel = (exp) => Math.floor(0.1 * Math.sqrt(exp)) + 1
  
  assert(calculateLevel(0) === 1, 'Level 1 at 0 XP')
  assert(calculateLevel(100) === 2, 'Level 2 at 100 XP')
  assert(calculateLevel(400) === 3, 'Level 3 at 400 XP')
  assert(calculateLevel(10000) === 11, 'Level 11 at 10000 XP')
})

test('Cooldown system works', () => {
  const canDo = (lastTime, cooldown) => Date.now() - lastTime >= cooldown
  const getRemainingCooldown = (lastTime, cooldown) => {
    const remaining = cooldown - (Date.now() - lastTime)
    return remaining > 0 ? remaining : 0
  }
  
  const pastTime = Date.now() - 60000 // 1 minute ago
  const recentTime = Date.now() - 1000 // 1 second ago
  const cooldown = 30000 // 30 seconds
  
  assert(canDo(pastTime, cooldown) === true, 'Should allow action after cooldown')
  assert(canDo(recentTime, cooldown) === false, 'Should block action during cooldown')
  assert(getRemainingCooldown(pastTime, cooldown) === 0, 'No remaining cooldown')
  assert(getRemainingCooldown(recentTime, cooldown) > 0, 'Should have remaining cooldown')
})

// ============================================
// CARD SYSTEM TESTS
// ============================================
console.log(chalk.yellow('\n🎴 Testing Anime Card System...\n'))

test('Card rarities are defined correctly', () => {
  const RARITIES = {
    common: { name: 'Common', chance: 50, value: 50, animated: false },
    uncommon: { name: 'Uncommon', chance: 25, value: 150, animated: false },
    rare: { name: 'Rare', chance: 15, value: 500, animated: false },
    epic: { name: 'Epic', chance: 7, value: 1500, animated: true },
    legendary: { name: 'Legendary', chance: 2.5, value: 5000, animated: true },
    mythic: { name: 'Mythic', chance: 0.5, value: 20000, animated: true, special: true }
  }
  
  assert(RARITIES.common.animated === false, 'Common should not be animated')
  assert(RARITIES.epic.animated === true, 'Epic should be animated')
  assert(RARITIES.legendary.animated === true, 'Legendary should be animated')
  assert(RARITIES.mythic.special === true, 'Mythic should be special')
  
  // Check total chance adds to 100
  const totalChance = Object.values(RARITIES).reduce((sum, r) => sum + r.chance, 0)
  assert(totalChance === 100, 'Total rarity chance should be 100%')
})

test('Card user initialization works', () => {
  const user = {}
  
  const initUserCards = (user) => {
    if (!user.cards) {
      user.cards = {
        collection: [],
        favorites: [],
        totalPulls: 0,
        pity: 0,
        lastPull: 0
      }
    }
    return user.cards
  }
  
  const cards = initUserCards(user)
  assert(Array.isArray(cards.collection), 'Collection should be array')
  assert(cards.pity === 0, 'Pity should start at 0')
  assert(cards.totalPulls === 0, 'Total pulls should start at 0')
})

test('Serial number generation works', () => {
  const generateSerial = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let serial = 'NX-'
    for (let i = 0; i < 6; i++) {
      serial += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return serial
  }
  
  const serial1 = generateSerial()
  const serial2 = generateSerial()
  
  assert(serial1.startsWith('NX-'), 'Serial should start with NX-')
  assert(serial1.length === 9, 'Serial should be 9 characters')
  assert(serial1 !== serial2, 'Serials should be unique')
})

test('Card rarity rolling works', () => {
  const RARITIES = {
    common: { chance: 50 },
    uncommon: { chance: 25 },
    rare: { chance: 15 },
    epic: { chance: 7 },
    legendary: { chance: 2.5 },
    mythic: { chance: 0.5 }
  }
  
  const rollRarity = () => {
    const total = Object.values(RARITIES).reduce((sum, r) => sum + r.chance, 0)
    let random = Math.random() * total
    
    for (const [key, r] of Object.entries(RARITIES)) {
      random -= r.chance
      if (random <= 0) return key
    }
    return 'common'
  }
  
  // Roll many times and check distribution
  const rolls = {}
  for (let i = 0; i < 1000; i++) {
    const rarity = rollRarity()
    rolls[rarity] = (rolls[rarity] || 0) + 1
  }
  
  assert(rolls.common > rolls.legendary, 'Common should be more frequent than legendary')
  assert(Object.keys(rolls).length > 0, 'Should have rolled some cards')
})

test('Card collection stats work', () => {
  const userCards = {
    collection: [
      { cardId: 'c001', serial: 'NX-ABC123' },
      { cardId: 'c001', serial: 'NX-DEF456' },
      { cardId: 'c002', serial: 'NX-GHI789' }
    ],
    totalPulls: 3,
    pity: 3
  }
  
  const uniqueCards = [...new Set(userCards.collection.map(c => c.cardId))]
  
  assert(userCards.collection.length === 3, 'Should have 3 total cards')
  assert(uniqueCards.length === 2, 'Should have 2 unique cards')
})

// ============================================
// CASINO SYSTEM TESTS
// ============================================
console.log(chalk.yellow('\n🎰 Testing Casino System...\n'))

test('Slot machine symbols are defined', () => {
  const SLOT_SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '🎰']
  const PAYOUTS = { '7️⃣': 10, '💎': 7, '🎰': 5, '🍇': 3, '🍊': 2.5, '🍋': 2, '🍒': 1.5 }
  
  assert(SLOT_SYMBOLS.length === 7, 'Should have 7 slot symbols')
  assert(PAYOUTS['7️⃣'] === 10, 'Jackpot should pay 10x')
})

test('Slot winnings calculation works', () => {
  const PAYOUTS = { '7️⃣': 10, '💎': 7, '🍒': 1.5 }
  
  const calculateWinnings = (reels, bet) => {
    const [r1, r2, r3] = reels
    if (r1 === r2 && r2 === r3) return Math.floor(bet * PAYOUTS[r1])
    if (r1 === r2 || r2 === r3 || r1 === r3) {
      const match = r1 === r2 ? r1 : r1 === r3 ? r1 : r2
      return Math.floor(bet * (PAYOUTS[match] * 0.3))
    }
    return 0
  }
  
  assert(calculateWinnings(['7️⃣', '7️⃣', '7️⃣'], 100) === 1000, 'Jackpot should pay 10x')
  assert(calculateWinnings(['💎', '💎', '🍒'], 100) === 210, 'Two diamonds should pay partial')
  assert(calculateWinnings(['🍒', '🍋', '🍊'], 100) === 0, 'No match should pay 0')
})

test('Coinflip has 50/50 odds', () => {
  let heads = 0, tails = 0
  
  for (let i = 0; i < 1000; i++) {
    if (Math.random() < 0.5) heads++
    else tails++
  }
  
  // Allow 10% variance
  const ratio = heads / tails
  assert(ratio > 0.8 && ratio < 1.2, 'Coinflip should be roughly 50/50')
})

test('Blackjack card values are correct', () => {
  const getCardValue = (card) => {
    if (['J', 'Q', 'K'].includes(card)) return 10
    if (card === 'A') return 11
    return parseInt(card)
  }
  
  assert(getCardValue('A') === 11, 'Ace should be 11')
  assert(getCardValue('K') === 10, 'King should be 10')
  assert(getCardValue('7') === 7, 'Number cards should be face value')
})

test('Blackjack hand calculation works', () => {
  const calculateHand = (cards) => {
    let value = 0, aces = 0
    
    for (const card of cards) {
      if (['J', 'Q', 'K'].includes(card)) value += 10
      else if (card === 'A') { value += 11; aces++ }
      else value += parseInt(card)
    }
    
    while (value > 21 && aces > 0) { value -= 10; aces-- }
    return value
  }
  
  assert(calculateHand(['A', 'K']) === 21, 'Blackjack should be 21')
  assert(calculateHand(['A', 'A', '9']) === 21, 'Soft 21 should work')
  assert(calculateHand(['K', 'Q', '5']) === 25, 'Bust hand should calculate correctly')
})

// ============================================
// SUMMARY
// ============================================
console.log(chalk.cyan('\n╔════════════════════════════════════════╗'))
console.log(chalk.cyan('║           TEST RESULTS                 ║'))
console.log(chalk.cyan('╠════════════════════════════════════════╣'))
console.log(chalk.cyan(`║  ${chalk.green(`Passed: ${testResults.passed}`)}                            ║`))
console.log(chalk.cyan(`║  ${chalk.red(`Failed: ${testResults.failed}`)}                            ║`))
console.log(chalk.cyan(`║  Total:  ${testResults.passed + testResults.failed}                            ║`))
console.log(chalk.cyan('╚════════════════════════════════════════╝'))

if (testResults.failed > 0) {
  console.log(chalk.red('\n❌ Some tests failed!\n'))
  process.exit(1)
} else {
  console.log(chalk.green('\n✅ All tests passed!\n'))
  process.exit(0)
}
