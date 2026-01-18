/**
 * Progress Bar Helper for NEXUS-MD
 * ▓ for filled, ░ for empty
 * Percent-based rendering (0–100)
 * Periodically updates using WhatsApp edit message (≥1.2s between edits)
 */

export function createProgressBar(conn, m, options = {}) {
  const {
    total = 100,
    title = 'Processing',
    successMsg = '✅ Done!',
    errorMsg = '❌ Failed!',
    successEmoji = '✅',
    errorEmoji = '❌'
  } = options

  let lastUpdate = 0
  let messageKey = null
  let currentPercent = 0
  let isFinished = false

  const getBar = (percent) => {
    const filledCount = Math.min(10, Math.max(0, Math.floor(percent / 10)))
    const emptyCount = 10 - filledCount
    return '▓'.repeat(filledCount) + '░'.repeat(emptyCount)
  }

  const formatProgress = (percent, status) => {
    return `*${title}*\n\n${getBar(percent)} ${percent}%\n\n${status || ''}`
  }

  return {
    /**
     * Update the progress bar
     * @param {number} percent - 0 to 100
     * @param {string} status - Optional status message
     */
    async update(percent, status) {
      if (isFinished) return
      currentPercent = Math.min(100, Math.max(0, Math.round(percent)))

      const now = Date.now()
      // Respect WhatsApp limits (≥1.2s between edits)
      if (now - lastUpdate < 1300 && currentPercent < 100 && currentPercent > 0) return

      const text = formatProgress(currentPercent, status)

      try {
        if (!messageKey) {
          const sent = await conn.sendMessage(m.chat, { text }, { quoted: m })
          messageKey = sent.key
        } else {
          await conn.sendMessage(m.chat, { text, edit: messageKey })
        }
        lastUpdate = now
      } catch (e) {
        console.error('Progress Bar Update Error:', e)
      }
    },

    /**
     * Finish the progress bar
     * @param {boolean} success - Whether the operation succeeded
     * @param {string} status - Final status message
     */
    async finish(success = true, status) {
      if (isFinished) return
      isFinished = true

      const percent = success ? 100 : currentPercent
      const emoji = success ? successEmoji : errorEmoji
      const msg = success ? successMsg : errorMsg

      const text = `*${title}*\n\n${getBar(percent)} ${percent}%\n\n${emoji} ${msg}\n${status || ''}`

      try {
        if (!messageKey) {
          await conn.sendMessage(m.chat, { text }, { quoted: m })
        } else {
          await conn.sendMessage(m.chat, { text, edit: messageKey })
        }
      } catch (e) {
        console.error('Progress Bar Finish Error:', e)
      }
    }
  }
}
