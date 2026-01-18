import { areJidsSameUser } from '@whiskeysockets/baileys'
import { formatMessage } from '../../lib/simple.js'
import { toSmallCaps } from '../../lib/font.js'

/**
 * Admin Command: Tag All
 * Tags all members in a group
 */
let handler = async (m, { conn, text, participants, groupMetadata }) => {
  let users = participants.map(u => u.id).filter(v => !areJidsSameUser(v, conn.user.jid))
  let header = `👥 Group: *${groupMetadata.subject}*\n` +
               `👥 Members: *${participants.length}*\n` +
               (text ? `📝 Message: ${text}\n` : '')

  let body = users.map(v => '◦ @' + v.replace(/@.+/, '')).join('\n')

  m.reply(
    header + '\n' + formatMessage(toSmallCaps('Members'), body),
    null,
    { mentions: users }
  )
}

handler.help = ['tagall [message]']
handler.tags = ['group']
handler.command = ['tagall']
handler.desc = 'Tag all group members with an optional message'
handler.admin = true
handler.group = true

export default handler
