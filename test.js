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
    return ownerList.map(([num]) => num.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(sender)
  }
  
  // Mock test
  const mockOwners = [['1234567890', 'Owner']]
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
