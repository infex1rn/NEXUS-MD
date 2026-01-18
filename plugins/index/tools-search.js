/**
 * Search & Information Commands
 */
import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text && !['crypto', 'news', 'stock'].includes(command)) throw `*Usage:* ${usedPrefix}${command} <query>`

  switch (command) {
    case 'google': {
      const res = await fetch(`https://apis.davidcyriltech.my.id/google?query=${encodeURIComponent(text)}`)
      const json = await res.json()
      if (!json.success) throw `❌ No results found.`
      let caption = `🔍 *GOOGLE SEARCH*\n\n`
      json.results.slice(0, 5).forEach((result, i) => { caption += `${i + 1}. *${result.title}*\n🔗 ${result.link}\n📝 ${result.snippet}\n\n` })
      return m.reply(caption)
    }
    case 'lyrics': {
      const res = await fetch(`https://apis.davidcyriltech.my.id/lyrics?query=${encodeURIComponent(text)}`)
      const json = await res.json()
      if (!json.success) throw `❌ Lyrics not found.`
      const { title, artist, lyrics, image } = json.result
      const caption = `🎶 *LYRICS: ${title.toUpperCase()}*\n👤 *Artist:* ${artist}\n\n${lyrics}`
      if (image) return conn.sendFile(m.chat, image, 'lyrics.jpg', caption, m)
      return m.reply(caption)
    }
    case 'imdb': case 'movie': case 'tv': {
      const res = await fetch(`https://apis.davidcyriltech.my.id/imdb?query=${encodeURIComponent(text)}`)
      const json = await res.json()
      if (!json.success) throw `❌ Not found.`
      const { title, year, rating, plot, actors, director, poster, type } = json.result
      const caption = `🎬 *${(type || 'IMDB').toUpperCase()}: ${title.toUpperCase()}*\n\n📅 *Year:* ${year}\n⭐ *Rating:* ${rating}\n👤 *Director:* ${director}\n👥 *Actors:* ${actors}\n\n📝 *Plot:* ${plot}`
      if (poster) return conn.sendFile(m.chat, poster, 'movie.jpg', caption, m)
      return m.reply(caption)
    }
    case 'wikipedia': case 'wiki': {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(text)}`)
      const json = await res.json()
      if (json.type === 'disambiguation' || json.title === 'Not found.') throw `❌ Wikipedia page not found.`
      const caption = `📖 *WIKIPEDIA: ${json.title.toUpperCase()}*\n\n${json.extract}\n\n🔗 *Full Article:* ${json.content_urls.desktop.page}`
      if (json.originalimage) return conn.sendFile(m.chat, json.originalimage.source, 'wiki.jpg', caption, m)
      return m.reply(caption)
    }
    case 'urban': {
      const res = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(text)}`)
      const json = await res.json()
      if (!json.list.length) throw `❌ No definition found.`
      const def = json.list[0]
      return m.reply(`🏙️ *URBAN DICTIONARY: ${text.toUpperCase()}*\n\n📖 *Definition:* ${def.definition.replace(/[\[\]]/g, '')}\n\n💬 *Example:* ${def.example.replace(/[\[\]]/g, '')}`)
    }
    case 'crypto': {
      const coin = text || 'bitcoin'
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin.toLowerCase()}&vs_currencies=usd&include_24hr_change=true`)
      const json = await res.json()
      if (!json[coin.toLowerCase()]) throw `❌ Cryptocurrency "${coin}" not found.`
      const price = json[coin.toLowerCase()].usd; const change = json[coin.toLowerCase()].usd_24h_change.toFixed(2)
      return m.reply(`🪙 *CRYPTO: ${coin.toUpperCase()}*\n\n💵 *Price:* $${price.toLocaleString()}\n${change >= 0 ? '📈' : '📉'} *24h Change:* ${change}%`)
    }
    case 'dict': case 'dictionary': {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(text)}`)
      const json = await res.json()
      if (!Array.isArray(json)) throw `❌ No definition found.`
      return m.reply(`📖 *DICTIONARY: ${text.toUpperCase()}*\n\n📝 *Definition:* ${json[0].meanings[0].definitions[0].definition}`)
    }
    case 'github': {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(text)}`)
      const json = await res.json()
      if (json.message === 'Not Found') throw `❌ GitHub user not found.`
      const caption = `🐙 *GITHUB: ${json.login}*\n\n👤 *Name:* ${json.name || 'N/A'}\n📝 *Bio:* ${json.bio || 'N/A'}\n👥 *Followers:* ${json.followers}\n👣 *Following:* ${json.following}\n📦 *Public Repos:* ${json.public_repos}\n🔗 *Profile:* ${json.html_url}`
      return conn.sendFile(m.chat, json.avatar_url, 'github.jpg', caption, m)
    }
    case 'npm': {
      const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(text)}/latest`)
      const json = await res.json()
      if (json.error) throw `❌ NPM package not found.`
      const caption = `📦 *NPM: ${json.name}*\n\n🏷️ *Version:* ${json.version}\n📝 *Description:* ${json.description}\n\n💻 *Install:* \`npm i ${json.name}\``
      return m.reply(caption)
    }
    case 'stock': {
      const res = await fetch(`https://apis.davidcyriltech.my.id/stock?query=${encodeURIComponent(text)}`)
      const json = await res.json()
      if (!json.success) throw `❌ Stock information not found.`
      const { name, symbol, price, change, changesPercentage } = json.result
      return m.reply(`📊 *STOCK: ${name}*\n\n🔠 *Symbol:* ${symbol}\n💵 *Price:* $${price}\n${change >= 0 ? '📈' : '📉'} *Change:* ${change} (${changesPercentage}%)`)
    }
    case 'character': {
      const res = await fetch(`https://apis.davidcyriltech.my.id/anime/character?query=${encodeURIComponent(text)}`)
      const json = await res.json()
      if (!json.success) throw `❌ Character not found.`
      const { name, about, image } = json.result
      return conn.sendFile(m.chat, image, 'char.jpg', `👤 *CHARACTER: ${name.toUpperCase()}*\n\n${about}`, m)
    }
    case 'pinterest': {
      const res = await fetch(`https://apis.davidcyriltech.my.id/pinterest?query=${encodeURIComponent(text)}`)
      const json = await res.json()
      if (!json.success || !json.results.length) throw `❌ No images found.`
      return conn.sendFile(m.chat, json.results[0], 'pin.jpg', `📌 *Pinterest:* ${text}`, m)
    }
    case 'wallpaper': {
      const res = await fetch(`https://apis.davidcyriltech.my.id/wallpaper?query=${encodeURIComponent(text)}`)
      const json = await res.json()
      if (!json.success || !json.results.length) throw `❌ No wallpapers found.`
      return conn.sendFile(m.chat, json.results[0].image, 'wp.jpg', `🖼️ *Wallpaper:* ${text}`, m)
    }
    case 'news': {
      const res = await fetch(`https://apis.davidcyriltech.my.id/news`)
      const json = await res.json()
      if (!json.success) throw `❌ Failed to fetch news.`
      let caption = `📰 *LATEST NEWS*\n\n`
      json.results.slice(0, 5).forEach((result, i) => { caption += `${i + 1}. *${result.title}*\n🔗 ${result.link}\n\n` })
      return m.reply(caption)
    }
    case 'weather': return global.plugins['util-weather.js'].call(conn, m, { conn, text, usedPrefix, command })
    case 'ytsearch': return global.plugins['dl-ytsearch.js'].call(conn, m, { conn, text, usedPrefix, command })
    case 'translate': return global.plugins['tools-translate.js'].call(conn, m, { conn, text, usedPrefix, command })
    case 'map': return m.reply(`🌐 *MAPS:* https://www.google.com/maps/search/${encodeURIComponent(text)}`)
  }
}

handler.help = [
  'google <q>', 'lyrics <q>', 'imdb <q>', 'wikipedia <q>', 'urban <q>', 'crypto <coin>', 'dict <q>', 'github <user>', 'npm <pkg>',
  'stock <q>', 'character <q>', 'movie <q>', 'tv <q>', 'pinterest <q>', 'wallpaper <q>', 'news', 'weather <q>',
  'ytsearch <q>', 'translate <text>', 'map <q>'
]
handler.tags = ['tools']
handler.command = [
  'google', 'lyrics', 'imdb', 'wikipedia', 'wiki', 'urban', 'crypto', 'dict', 'dictionary',
  'github', 'npm', 'stock', 'character', 'movie', 'tv', 'pinterest', 'wallpaper', 'news',
  'weather', 'ytsearch', 'translate', 'map'
]

export default handler
