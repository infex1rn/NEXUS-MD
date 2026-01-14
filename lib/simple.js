import path from 'path'
import chalk from 'chalk'
import fetch from 'node-fetch'
import fs from 'fs'
import { format } from 'util'
import { fileURLToPath } from 'url'
import { fileTypeFromBuffer } from 'file-type'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Import baileys-pro functions using named exports
 */
import {
  makeWASocket as _makeWaSocket,
  proto,
  downloadContentFromMessage,
  jidDecode,
  areJidsSameUser,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  WAMessageStubType,
  extractMessageContent,
} from 'baileys-pro'

/**
 * Extended WASocket with additional helper methods
 */
export function makeWASocketExtended(connectionOptions, options = {}) {
  let conn = _makeWaSocket(connectionOptions)

  let sock = Object.defineProperties(conn, {
    chats: {
      value: { ...(options.chats || {}) },
      writable: true,
    },
    decodeJid: {
      value(jid) {
        if (!jid || typeof jid !== 'string') return jid || null
        return jid.decodeJid()
      },
    },
    logger: {
      get() {
        return {
          info(...args) {
            console.log(chalk.bold.bgGreen('INFO '), chalk.cyan(format(...args)))
          },
          error(...args) {
            console.log(chalk.bold.bgRed('ERROR '), chalk.red(format(...args)))
          },
          warn(...args) {
            console.log(chalk.bold.bgYellow('WARNING '), chalk.yellow(format(...args)))
          },
        }
      },
      enumerable: true,
    },
    getFile: {
      async value(PATH, saveToFile = false) {
        let res, filename
        const data = Buffer.isBuffer(PATH)
          ? PATH
          : PATH instanceof ArrayBuffer
            ? Buffer.from(PATH)
            : /^data:.*?\/.*?;base64,/i.test(PATH)
              ? Buffer.from(PATH.split`,`[1], 'base64')
              : /^https?:\/\//.test(PATH)
                ? await (res = await fetch(PATH)).buffer()
                : fs.existsSync(PATH)
                  ? ((filename = PATH), fs.readFileSync(PATH))
                  : typeof PATH === 'string'
                    ? PATH
                    : Buffer.alloc(0)
        if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
        const type = (await fileTypeFromBuffer(data)) || {
          mime: 'application/octet-stream',
          ext: '.bin',
        }
        if (data && saveToFile && !filename)
          (filename = path.join(__dirname, '../tmp/' + new Date() * 1 + '.' + type.ext)),
            await fs.promises.writeFile(filename, data)
        return {
          res,
          filename,
          ...type,
          data,
          deleteFile() {
            return filename && fs.promises.unlink(filename)
          },
        }
      },
      enumerable: true,
    },
    sendFile: {
      async value(jid, PATH, filename = '', caption = '', quoted, ptt = false, options = {}) {
        let type = await conn.getFile(PATH, true)
        let { res, data: file, filename: pathFile } = type
        if ((res && res.status !== 200) || file.length <= 65536) {
          try {
            throw { json: JSON.parse(file.toString()) }
          } catch (e) {
            if (e.json) throw e.json
          }
        }
        let opt = {}
        if (quoted) opt.quoted = quoted
        if (!type) options.asDocument = true
        let mtype = '',
          mimetype = options.mimetype || type.mime
        if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker))
          mtype = 'sticker'
        else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage))
          mtype = 'image'
        else if (/video/.test(type.mime)) mtype = 'video'
        else if (/audio/.test(type.mime)) {
          mtype = 'audio'
          mimetype = options.mimetype || 'audio/ogg; codecs=opus'
        } else mtype = 'document'
        if (options.asDocument) mtype = 'document'

        delete options.asSticker
        delete options.asDocument
        delete options.asImage

        let message = {
          ...options,
          caption,
          ptt,
          [mtype]: { url: pathFile },
          mimetype,
          fileName: filename || pathFile.split('/').pop(),
        }
        let m
        try {
          m = await conn.sendMessage(jid, message, { ...opt, ...options })
        } catch (e) {
          console.error(e)
          m = null
        } finally {
          if (!m)
            m = await conn.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options })
          return m
        }
      },
      enumerable: true,
    },
    reply: {
      value(jid, text = '', quoted, options) {
        return Buffer.isBuffer(text)
          ? conn.sendFile(jid, text, 'file', '', quoted, false, options)
          : conn.sendMessage(jid, { ...options, text }, { quoted, ...options })
      },
    },
    sendPoll: {
      async value(jid, name = '', options = [], opts = {}) {
        if (!Array.isArray(options[0])) options = options.map(o => [o])
        const pollMessage = {
          name: name,
          options: options.map(opt => ({ optionName: opt[0] || '' })),
          selectableOptionsCount: opts.multiSelect ? 0 : 1,
        }
        return conn.relayMessage(jid, { pollCreationMessage: pollMessage }, { ...opts })
      },
      enumerable: true,
    },
    downloadM: {
      async value(m, type, saveToFile) {
        let filename
        if (!m || !(m.url || m.directPath)) return Buffer.alloc(0)
        const stream = await downloadContentFromMessage(m, type)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk])
        }
        if (saveToFile) ({ filename } = await conn.getFile(buffer, true))
        return saveToFile && fs.existsSync(filename) ? filename : buffer
      },
      enumerable: true,
    },
    parseMention: {
      value(text = '') {
        return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
      },
      enumerable: true,
    },
    getName: {
      value(jid = '', withoutContact = false) {
        jid = conn.decodeJid(jid)
        let v
        if (jid.endsWith('@g.us'))
          return new Promise(async resolve => {
            v = conn.chats[jid] || {}
            if (!(v.name || v.subject)) v = (await conn.groupMetadata(jid)) || {}
            resolve(v.name || v.subject || jid)
          })
        else
          v = jid === '0@s.whatsapp.net'
            ? { jid, vname: 'WhatsApp' }
            : areJidsSameUser(jid, conn.user.id)
              ? conn.user
              : conn.chats[jid] || {}
        return v.name || v.subject || v.vname || v.notify || v.verifiedName || jid
      },
      enumerable: true,
    },
    copyNForward: {
      async value(jid, message, forwardingScore = true, options = {}) {
        let mtype = Object.keys(message.message)[0]
        let m = generateForwardMessageContent(message, !!forwardingScore)
        let ctype = Object.keys(m)[0]
        if (forwardingScore && typeof forwardingScore === 'number' && forwardingScore > 1)
          m[ctype].contextInfo.forwardingScore += forwardingScore
        m[ctype].contextInfo = {
          ...(message.message[mtype].contextInfo || {}),
          ...(m[ctype].contextInfo || {}),
        }
        m = generateWAMessageFromContent(jid, m, {
          ...options,
          userJid: conn.user.jid,
        })
        await conn.relayMessage(jid, m.message, { messageId: m.key.id, additionalAttributes: { ...options } })
        return m
      },
      enumerable: true,
    },
    insertAllGroup: {
      async value() {
        const groups = (await conn.groupFetchAllParticipating().catch(_ => null)) || {}
        for (const group in groups)
          conn.chats[group] = {
            ...(conn.chats[group] || {}),
            id: group,
            subject: groups[group].subject,
            isChats: true,
            metadata: groups[group],
          }
        return conn.chats
      },
    },
    pushMessage: {
      async value(m) {
        if (!m) return
        if (!Array.isArray(m)) m = [m]
        for (const message of m) {
          try {
            if (!message) continue
            const _mtype = Object.keys(message.message || {})
            const mtype =
              (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(_mtype[0]) && _mtype[0]) ||
              (_mtype.length >= 3 && _mtype[1] !== 'messageContextInfo' && _mtype[1]) ||
              _mtype[_mtype.length - 1]
            const chat = conn.decodeJid(
              message.key.remoteJid || message.message?.senderKeyDistributionMessage?.groupId || ''
            )
            if (!chat || chat === 'status@broadcast') continue
            const isGroup = chat.endsWith('@g.us')
            let chats = conn.chats[chat]
            if (!chats) {
              if (isGroup) await conn.insertAllGroup().catch(console.error)
              chats = conn.chats[chat] = { id: chat, isChats: true, ...(conn.chats[chat] || {}) }
            }
            if (isGroup && !chats.metadata) {
              const metadata = await conn.groupMetadata(chat).catch(_ => ({}))
              chats.subject = metadata.subject || ''
              chats.metadata = metadata
            }
            chats.isChats = true
            if (!chats.messages) chats.messages = {}
          } catch (e) {
            console.error(e)
          }
        }
      },
    },
    serializeM: {
      value(m) {
        return smsg(conn, m)
      },
    },
  })
  
  if (sock.user?.id) sock.user.jid = sock.decodeJid(sock.user.id)
  return sock
}

/**
 * Serialize Message
 */
export function smsg(conn, m, hasParent) {
  if (!m) return m
  let M = proto.WebMessageInfo
  m = M.fromObject(m)
  m.conn = conn
  
  if (!m.mediaMessage) delete m.download

  return m
}

/**
 * Initialize prototype extensions
 */
export function serialize() {
  const MediaType = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage']
  
  return Object.defineProperties(proto.WebMessageInfo.prototype, {
    conn: {
      value: undefined,
      enumerable: false,
      writable: true,
    },
    id: {
      get() {
        return this.key?.id
      },
    },
    isBaileys: {
      get() {
        return this.id?.length === 16 || (this.id?.startsWith('3EB0') && this.id?.length === 12) || false
      },
    },
    chat: {
      get() {
        const senderKeyDistributionMessage = this.message?.senderKeyDistributionMessage?.groupId
        return (
          this.key?.remoteJid ||
          (senderKeyDistributionMessage && senderKeyDistributionMessage !== 'status@broadcast') ||
          ''
        ).decodeJid()
      },
    },
    isGroup: {
      get() {
        return this.chat.endsWith('@g.us')
      },
      enumerable: true,
    },
    sender: {
      get() {
        return this.conn?.decodeJid(
          (this.key?.fromMe && this.conn?.user.id) ||
          this.participant ||
          this.key.participant ||
          this.chat ||
          ''
        )
      },
      enumerable: true,
    },
    fromMe: {
      get() {
        return this.key?.fromMe || areJidsSameUser(this.conn?.user.id, this.sender) || false
      },
    },
    mtype: {
      get() {
        if (!this.message) return ''
        const type = Object.keys(this.message)
        return (
          (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(type[0]) && type[0]) ||
          (type.length >= 3 && type[1] !== 'messageContextInfo' && type[1]) ||
          type[type.length - 1]
        )
      },
      enumerable: true,
    },
    msg: {
      get() {
        if (!this.message) return null
        return this.message[this.mtype]
      },
    },
    mediaMessage: {
      get() {
        if (!this.message) return null
        const Message = (this.msg?.url || this.msg?.directPath ? { ...this.message } : extractMessageContent(this.message)) || null
        if (!Message) return null
        const mtype = Object.keys(Message)[0]
        return MediaType.includes(mtype) ? Message : null
      },
      enumerable: true,
    },
    mediaType: {
      get() {
        let message
        if (!(message = this.mediaMessage)) return null
        return Object.keys(message)[0]
      },
      enumerable: true,
    },
    quoted: {
      get() {
        const self = this
        const msg = self.msg
        const contextInfo = msg?.contextInfo
        const quoted = contextInfo?.quotedMessage
        if (!msg || !contextInfo || !quoted) return null
        const type = Object.keys(quoted)[0]
        let q = quoted[type]
        const text = typeof q === 'string' ? q : q.text
        return Object.defineProperties(
          JSON.parse(JSON.stringify(typeof q === 'string' ? { text: q } : q)),
          {
            mtype: {
              get() { return type },
              enumerable: true,
            },
            id: {
              get() { return contextInfo.stanzaId },
              enumerable: true,
            },
            chat: {
              get() { return contextInfo.remoteJid || self.chat },
              enumerable: true,
            },
            sender: {
              get() { return (contextInfo.participant || this.chat || '').decodeJid() },
              enumerable: true,
            },
            fromMe: {
              get() { return areJidsSameUser(this.sender, self.conn?.user.jid) },
              enumerable: true,
            },
            text: {
              get() { return text || this.caption || this.contentText || '' },
              enumerable: true,
            },
            download: {
              value(saveToFile = false) {
                const mtype = this.mediaType
                return self.conn?.downloadM(this.mediaMessage?.[mtype], mtype?.replace(/message/i, ''), saveToFile)
              },
              enumerable: true,
            },
            reply: {
              value(text, chatId, options) {
                return self.conn?.reply(chatId || this.chat, text, this.vM, options)
              },
              enumerable: true,
            },
          }
        )
      },
      enumerable: true,
    },
    _text: {
      value: null,
      writable: true,
    },
    text: {
      get() {
        const msg = this.msg
        const text = (typeof msg === 'string' ? msg : msg?.text) || msg?.caption || msg?.contentText || ''
        return typeof this._text === 'string' ? this._text : text || ''
      },
      set(str) {
        return (this._text = str)
      },
      enumerable: true,
    },
    mentionedJid: {
      get() {
        return (this.msg?.contextInfo?.mentionedJid?.length && this.msg.contextInfo.mentionedJid) || []
      },
      enumerable: true,
    },
    name: {
      get() {
        return this.pushName || this.conn?.getName(this.sender)
      },
      enumerable: true,
    },
    download: {
      value(saveToFile = false) {
        const mtype = this.mediaType
        return this.conn?.downloadM(this.mediaMessage?.[mtype], mtype?.replace(/message/i, ''), saveToFile)
      },
      enumerable: true,
    },
    reply: {
      value(text, chatId, options) {
        return this.conn?.reply(chatId || this.chat, text, this, options)
      },
    },
    react: {
      value(text) {
        return this.conn?.sendMessage(this.chat, { react: { text, key: this.key } })
      },
      enumerable: true,
    },
  })
}

/**
 * Initialize protoType extensions
 */
export function protoType() {
  String.prototype.decodeJid = function decodeJid() {
    if (/:\d+@/gi.test(this)) {
      const decode = jidDecode(this) || {}
      return ((decode.user && decode.server && decode.user + '@' + decode.server) || this).trim()
    } else return this.trim()
  }
  
  Number.prototype.toTimeString = function toTimeString() {
    const seconds = Math.floor((this / 1000) % 60)
    const minutes = Math.floor((this / (60 * 1000)) % 60)
    const hours = Math.floor((this / (60 * 60 * 1000)) % 24)
    const days = Math.floor(this / (24 * 60 * 60 * 1000))
    return (
      (days ? `${days} day(s) ` : '') +
      (hours ? `${hours} hour(s) ` : '') +
      (minutes ? `${minutes} minute(s) ` : '') +
      (seconds ? `${seconds} second(s)` : '')
    ).trim()
  }
}
