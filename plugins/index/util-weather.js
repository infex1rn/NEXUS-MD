/**
 * Utility Command: Weather
 * Get weather information for a city
 */
import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    throw `*Please provide a city name!*\n\nExample: *${usedPrefix}${command} New York*`
  }
  
  try {
    await m.reply('🌤️ *Fetching weather data...*')
    
    // Using wttr.in API (free, no key needed)
    const response = await fetch(`https://wttr.in/${encodeURIComponent(text)}?format=j1`)
    
    if (!response.ok) {
      throw '*City not found! Please check the spelling.*'
    }
    
    const data = await response.json()
    const current = data.current_condition[0]
    const location = data.nearest_area[0]
    
    const cityName = location.areaName[0].value
    const country = location.country[0].value
    const temp = current.temp_C
    const feelsLike = current.FeelsLikeC
    const humidity = current.humidity
    const windSpeed = current.windspeedKmph
    const condition = current.weatherDesc[0].value
    const uv = current.uvIndex
    
    const weatherEmoji = getWeatherEmoji(condition)
    
    const message = `
${weatherEmoji} *Weather for ${cityName}, ${country}*

🌡️ *Temperature:* ${temp}°C
🤒 *Feels Like:* ${feelsLike}°C
☁️ *Condition:* ${condition}
💧 *Humidity:* ${humidity}%
💨 *Wind:* ${windSpeed} km/h
☀️ *UV Index:* ${uv}
`.trim()
    
    await m.reply(message)
    
  } catch (e) {
    m.reply(`❌ Error: ${e.message || e}`)
  }
}

function getWeatherEmoji(condition) {
  const c = condition.toLowerCase()
  if (c.includes('sun') || c.includes('clear')) return '☀️'
  if (c.includes('cloud') && c.includes('partly')) return '⛅'
  if (c.includes('cloud')) return '☁️'
  if (c.includes('rain') || c.includes('shower')) return '🌧️'
  if (c.includes('thunder') || c.includes('storm')) return '⛈️'
  if (c.includes('snow')) return '🌨️'
  if (c.includes('fog') || c.includes('mist')) return '🌫️'
  return '🌤️'
}

handler.help = ['weather <city>']
handler.tags = ['utility']
handler.command = ['weather', 'cuaca']
handler.desc = 'Get weather information for a city'

export default handler
