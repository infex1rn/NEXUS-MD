import { smsg } from './lib/simple.js'
import { fileURLToPath } from 'url'
import path, { join } from 'path'
import { unwatchFile, watchFile } from 'fs'
import chalk from 'chalk'

const isNumber = x => typeof x === 'number' && !isNaN(x)

/**
 * Handle messages upsert
 */
export async function handler(chatUpdate) {
  this.msgqueue = this.msgqueue || []
  if (!chatUpdate) return
  
  this.pushMessage(chatUpdate.messages).catch(console.error)
  
  let m = chatUpdate.messages[chatUpdate.messages.length - 1]
  if (!m) return
  
  if (global.db.data == null) await global.loadDatabase()
  
  let settings = global.db?.data?.settings?.[this.user?.jid] || {}
  
  try {
    m = smsg(this, m) || m
    if (!m) return
    
    // Handle button responses
    if (m.message) {
      if (m.message.buttonsResponseMessage) {
        m.text = m.message.buttonsResponseMessage.selectedButtonId || ''
      } else if (m.message.templateButtonReplyMessage) {
        m.text = m.message.templateButtonReplyMessage.selectedId || ''
      } else if (m.message.listResponseMessage) {
        m.text = m.message.listResponseMessage.singleSelectReply?.selectedRowId || ''
      }
    }
    
    // Initialize user in database
    try {
      let user = global.db.data.users[m.sender]
      if (typeof user !== 'object') global.db.data.users[m.sender] = {}
      if (user) {
        if (!('warn' in user)) user.warn = 0
        if (!('registered' in user)) user.registered = false
        if (!isNumber(user.afk)) user.afk = -1
        if (!('afkReason' in user)) user.afkReason = ''
        if (!('banned' in user)) user.banned = false
        if (!('name' in user)) user.name = m.name || ''
      } else {
        global.db.data.users[m.sender] = {
          warn: 0,
          registered: false,
          name: m.name || '',
          afk: -1,
          afkReason: '',
          banned: false,
        }
      }
      
      // Initialize chat in database
      let chat = global.db.data.chats[m.chat]
      if (typeof chat !== 'object') global.db.data.chats[m.chat] = {}
      if (chat) {
        if (!('antiLink' in chat)) chat.antiLink = false
        if (!('isBanned' in chat)) chat.isBanned = false
        if (!('welcome' in chat)) chat.welcome = false
        if (!('sWelcome' in chat)) chat.sWelcome = ''
        if (!('sBye' in chat)) chat.sBye = ''
        if (!('sPromote' in chat)) chat.sPromote = ''
        if (!('sDemote' in chat)) chat.sDemote = ''
        if (!('detect' in chat)) chat.detect = false
      } else {
        global.db.data.chats[m.chat] = {
          antiLink: false,
          isBanned: false,
          welcome: false,
          sWelcome: '',
          sBye: '',
          sPromote: '',
          sDemote: '',
          detect: false,
        }
      }
      
      // Initialize settings
      settings = global.db.data.settings[this.user.jid]
      if (typeof settings !== 'object') global.db.data.settings[this.user.jid] = {}
      if (settings) {
        if (!('self' in settings)) settings.self = false
        if (!('autoread' in settings)) settings.autoread = false
        if (!('restrict' in settings)) settings.restrict = false
      } else {
        global.db.data.settings[this.user.jid] = {
          self: false,
          autoread: false,
          restrict: false,
        }
      }
    } catch (e) {
      console.error(e)
    }
    
    // Mode checks
    if (settings?.self && m.chat.endsWith('g.us')) return
    if (global.opts['nyimak']) return
    if (typeof m.text !== 'string') m.text = ''

    // Owner/mod checks
    const isROwner = [
      conn.decodeJid(global.conn.user.id),
      ...global.owner.map(([number]) => number),
    ]
      .map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
      .includes(m.sender)
    const isOwner = isROwner || m.fromMe
    const isMods = isOwner || global.mods.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)

    // Private mode check
    if (process.env.MODE && process.env.MODE.toLowerCase() === 'private' && !(isROwner || isOwner)) return
    if (m.isBaileys) return

    // Group/participant context
    let usedPrefix
    const groupMetadata = (m.isGroup
      ? (conn.chats[m.chat] || {}).metadata || (await this.groupMetadata(m.chat).catch(_ => null))
      : {}) || {}
    const participants = (m.isGroup ? groupMetadata.participants : []) || []
    const user = (m.isGroup ? participants.find(u => conn.decodeJid(u.id) === m.sender) : {}) || {}
    const bot = (m.isGroup ? participants.find(u => conn.decodeJid(u.id) == conn.user.jid) : {}) || {}
    const isRAdmin = user?.admin == 'superadmin' || false
    const isAdmin = isRAdmin || user?.admin == 'admin' || false
    const isBotAdmin = bot?.admin || false

    // Plugin execution
    const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')
    
    for (let name in global.plugins) {
      let plugin = global.plugins[name]
      if (!plugin) continue
      if (plugin.disabled) continue
      
      const __filename = join(___dirname, name)
      
      // Execute 'all' function if exists
      if (typeof plugin.all === 'function') {
        try {
          await plugin.all.call(this, m, {
            chatUpdate,
            __dirname: ___dirname,
            __filename,
          })
        } catch (e) {
          console.error(e)
        }
      }
      
      // Build prefix matcher
      const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
      let _prefix = plugin.customPrefix ? plugin.customPrefix : conn.prefix ? conn.prefix : global.prefix
      let match = (
        _prefix instanceof RegExp
          ? [[_prefix.exec(m.text), _prefix]]
          : Array.isArray(_prefix)
            ? _prefix.map(p => {
                let re = p instanceof RegExp ? p : new RegExp(str2Regex(p))
                return [re.exec(m.text), re]
              })
            : typeof _prefix === 'string'
              ? [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]]
              : [[[], new RegExp()]]
      ).find(p => p[1])
      
      // Execute 'before' function if exists
      if (typeof plugin.before === 'function') {
        if (
          await plugin.before.call(this, m, {
            match,
            conn: this,
            participants,
            groupMetadata,
            user,
            bot,
            isROwner,
            isOwner,
            isRAdmin,
            isAdmin,
            isBotAdmin,
            chatUpdate,
            __dirname: ___dirname,
            __filename,
          })
        )
          continue
      }
      
      if (typeof plugin !== 'function') continue
      
      if ((usedPrefix = (match[0] || '')[0])) {
        let noPrefix = m.text.replace(usedPrefix, '')
        let [command, ...args] = noPrefix.trim().split` `.filter(v => v)
        args = args || []
        let _args = noPrefix.trim().split` `.slice(1)
        let text = _args.join` `
        command = (command || '').toLowerCase()
        let fail = plugin.fail || global.dfail
        
        // Check if command matches
        let isAccept =
          plugin.command instanceof RegExp
            ? plugin.command.test(command)
            : Array.isArray(plugin.command)
              ? plugin.command.some(cmd =>
                  cmd instanceof RegExp ? cmd.test(command) : cmd === command
                )
              : typeof plugin.command === 'string'
                ? plugin.command === command
                : false

        if (!isAccept) continue
        
        m.plugin = name
        
        // Check bans
        if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
          let chat = global.db.data.chats[m.chat]
          let user = global.db.data.users[m.sender]
          if (name != 'owner-unbanchat.js' && chat?.isBanned) return
          if (name != 'owner-unbanuser.js' && user?.banned) return
        }
        
        // Permission checks
        if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) {
          fail('owner', m, this)
          continue
        }
        if (plugin.rowner && !isROwner) {
          fail('rowner', m, this)
          continue
        }
        if (plugin.owner && !isOwner) {
          fail('owner', m, this)
          continue
        }
        if (plugin.mods && !isMods) {
          fail('mods', m, this)
          continue
        }
        if (plugin.group && !m.isGroup) {
          fail('group', m, this)
          continue
        } else if (plugin.botAdmin && !isBotAdmin) {
          fail('botAdmin', m, this)
          continue
        } else if (plugin.admin && !isAdmin) {
          fail('admin', m, this)
          continue
        }
        if (plugin.private && m.isGroup) {
          fail('private', m, this)
          continue
        }
        
        m.isCommand = true
        
        let extra = {
          match,
          usedPrefix,
          noPrefix,
          _args,
          args,
          command,
          text,
          conn: this,
          participants,
          groupMetadata,
          user,
          bot,
          isROwner,
          isOwner,
          isRAdmin,
          isAdmin,
          isBotAdmin,
          chatUpdate,
          __dirname: ___dirname,
          __filename,
        }
        
        try {
          await plugin.call(this, m, extra)
        } catch (e) {
          m.error = e
          console.error(e)
          m.reply(`❌ Error: ${e.message}`)
        } finally {
          if (typeof plugin.after === 'function') {
            try {
              await plugin.after.call(this, m, extra)
            } catch (e) {
              console.error(e)
            }
          }
        }
        break
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    // Update stats
    if (m) {
      let stats = global.db.data.stats
      if (m.plugin) {
        let now = +new Date()
        if (m.plugin in stats) {
          let stat = stats[m.plugin]
          if (!isNumber(stat.total)) stat.total = 1
          if (!isNumber(stat.success)) stat.success = m.error != null ? 0 : 1
          if (!isNumber(stat.last)) stat.last = now
          stat.total += 1
          stat.last = now
          if (m.error == null) stat.success += 1
        } else {
          stats[m.plugin] = {
            total: 1,
            success: m.error != null ? 0 : 1,
            last: now,
          }
        }
      }
    }

    // Auto-read if enabled
    if (process.env.autoRead === 'true') await conn.readMessages([m.key])
  }
}

/**
 * Handle group participants update
 */
export async function participantsUpdate({ id, participants, action }) {
  if (global.opts['self'] || this.isInit) return
  if (global.db.data == null) await loadDatabase()
  
  const chat = global.db.data.chats[id] || {}

  switch (action) {
    case 'add':
      if (chat.welcome) {
        let groupMetadata = await this.groupMetadata(id).catch(_ => null) || {}
        for (let user of participants) {
          let pp
          try {
            pp = await this.profilePictureUrl(user, 'image')
          } catch {
            pp = 'https://i.imgur.com/8B4jwGq.jpeg'
          }
          
          let text = (chat.sWelcome || this.welcome || conn.welcome || 'Welcome, @user!')
            .replace('@group', groupMetadata.subject || '')
            .replace('@desc', groupMetadata.desc?.toString() || '')
            .replace('@user', '@' + user.split('@')[0])

          this.sendMessage(id, {
            text: text,
            mentions: [user],
          })
        }
      }
      break

    case 'remove':
      if (chat.welcome) {
        let groupMetadata = await this.groupMetadata(id).catch(_ => null) || {}
        for (let user of participants) {
          let text = (chat.sBye || this.bye || conn.bye || 'Goodbye, @user!')
            .replace('@user', '@' + user.split('@')[0])

          this.sendMessage(id, {
            text: text,
            mentions: [user],
          })
        }
      }
      break
      
    case 'promote':
      if (chat.detect) {
        const promoteText = (chat.sPromote || this.spromote || conn.spromote || '*@user* is now admin!')
          .replace('@user', '@' + participants[0].split('@')[0])
        this.sendMessage(id, { text: promoteText, mentions: [participants[0]] })
      }
      break
      
    case 'demote':
      if (chat.detect) {
        const demoteText = (chat.sDemote || this.sdemote || conn.sdemote || '*@user* is no longer admin.')
          .replace('@user', '@' + participants[0].split('@')[0])
        this.sendMessage(id, { text: demoteText, mentions: [participants[0]] })
      }
      break
  }
}

/**
 * Handle groups update
 */
export async function groupsUpdate(groupsUpdate) {
  if (global.opts['self']) return
  
  for (const groupUpdate of groupsUpdate) {
    const id = groupUpdate.id
    if (!id) continue
    
    let chats = global.db.data.chats[id] || {}
    if (!chats.detect) continue

    let text = ''
    if (groupUpdate.desc) {
      text = `*📝 Description updated:*\n${groupUpdate.desc}`
    } else if (groupUpdate.subject) {
      text = `*📌 Group name changed to:*\n${groupUpdate.subject}`
    } else if (groupUpdate.icon) {
      text = `*🖼️ Group icon updated*`
    } else if (groupUpdate.revoke) {
      text = `*🔗 Group link changed to:*\n${groupUpdate.revoke}`
    } else if (groupUpdate.announce === true) {
      text = `*🔒 Group is now closed!* Only admins can send messages.`
    } else if (groupUpdate.announce === false) {
      text = `*🔓 Group is now open!* All participants can send messages.`
    }

    if (text) await this.sendMessage(id, { text })
  }
}

/**
 * Handle message delete
 */
export async function deleteUpdate(message) {
  try {
    const { fromMe } = message
    if (fromMe) return
    
    const chat = global.db.data.chats[message.remoteJid] || {}
    if (!chat.antiDelete) return
    
    // Anti-delete functionality placeholder
  } catch (e) {
    console.error(e)
  }
}

/**
 * Handle presence update (for AFK)
 */
export async function presenceUpdate(presenceUpdate) {
  const id = presenceUpdate.id
  const nouser = Object.keys(presenceUpdate.presences)
  const status = presenceUpdate.presences[nouser]?.lastKnownPresence
  const user = global.db.data.users[nouser[0]]

  if (user?.afk && status === 'composing' && user.afk > -1) {
    const username = nouser[0].split('@')[0]
    const timeAfk = new Date() - user.afk
    const caption = `@${username} stopped being AFK.\n\nReason: ${user.afkReason || 'No reason'}\nDuration: ${formatDuration(timeAfk)}`

    this.reply(id, caption, null, { mentions: [nouser[0]] })
    user.afk = -1
    user.afkReason = ''
  }
}

/**
 * Format duration in human readable format
 */
function formatDuration(ms) {
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

/**
 * Default fail handler
 */
global.dfail = (type, m, conn) => {
  const userTag = `👋 Hey *@${m.sender.split('@')[0]}*, `
  
  const msg = {
    owner: `${userTag}This command can only be used by the *Bot Owner*!`,
    rowner: `${userTag}This command is restricted to the *Real Owner* only!`,
    mods: `${userTag}This command can only be used by *Moderators*!`,
    group: `${userTag}This command can only be used in *Group Chats*!`,
    private: `${userTag}This command can only be used in *Private Chats*!`,
    admin: `${userTag}This command is only for *Group Admins*!`,
    botAdmin: `${userTag}Make the bot an *Admin* to use this command!`,
  }[type]
  
  if (msg) return m.reply(msg, null, { mentions: [m.sender] })
}

let file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
  unwatchFile(file)
  console.log(chalk.redBright('Update handler.js'))
  if (global.reloadHandler) console.log(await global.reloadHandler())
})
