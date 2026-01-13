import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

// Owner configuration
const ownerEnv = process.env.OWNERS || "1234567890;Owner;0987654321;CoOwner"
const ownerList = ownerEnv.split(';')

global.owner = []
for (let i = 0; i < ownerList.length; i += 2) {
    const owner = [
        ownerList[i],            
        ownerList[i + 1] || 'Owner',         
        true                        
    ]
    global.owner.push(owner)
}

global.mods = process.env.MODS ? process.env.MODS.split(',') : []
global.allowed = process.env.ALLOWED ? process.env.ALLOWED.split(',') : []

// Bot configuration
global.botname = process.env.BOTNAME || 'NEXUS-MD'
global.packname = process.env.PACKNAME || 'NEXUS┃ᴮᴼᵀ'
global.author = process.env.AUTHOR || 'ᴺᵉˣᵘˢ'

// Prefix configuration
global.prefix = new RegExp(
  '^[' +
    (process.env.PREFIX || '*/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-.@').replace(
      /[|\\{}()[\]^$+*?.\-\^]/g,
      '\\$&'
    ) +
    ']'
)

// Status indicators
global.wait = '*⌛ Processing...*'
global.rwait = '⌛'
global.dmoji = '🤖'
global.done = '✅'
global.error = '❌'
global.xmoji = '🔥'

// Limits
global.multiplier = 69
global.maxwarn = 3

// API endpoints (placeholder - users should provide their own)
global.APIs = {
    base: 'https://api.example.com'
}

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  import(`${file}?update=${Date.now()}`)
})
