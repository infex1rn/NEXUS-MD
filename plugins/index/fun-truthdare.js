/**
 * Fun Command: Truth or Dare
 * Get a random truth or dare
 */
const truths = [
  "What's the most embarrassing thing you've ever done?",
  "What's your biggest fear?",
  "What's the last lie you told?",
  "What's your biggest insecurity?",
  "Have you ever cheated on a test?",
  "What's the most childish thing you still do?",
  "What's your guilty pleasure?",
  "What's the worst thing you've ever said to someone?",
  "Have you ever had a crush on a friend's partner?",
  "What's your most embarrassing memory from school?",
  "What's something you've never told anyone?",
  "What's the meanest thing you've done to a sibling or friend?",
  "What's your worst habit?",
  "Have you ever pretended to be sick to skip work/school?",
  "What's the last thing you searched on your phone?"
]

const dares = [
  "Send a voice note singing your favorite song",
  "Change your profile picture to something funny for 1 hour",
  "Send a message to your 5th contact saying 'I love you'",
  "Do 10 pushups and send a video",
  "Post an embarrassing story on your status",
  "Send your most recent selfie",
  "Text your crush and screenshot the response",
  "Speak in a funny accent for the next 5 messages",
  "Share your screen time for today",
  "Send your search history from today",
  "Call someone and sing Happy Birthday",
  "Do your best impression of someone in this chat",
  "Send the last 3 photos from your gallery",
  "Make up a short poem about someone in this chat",
  "Share your most used emoji"
]

let handler = async (m, { command }) => {
  let message
  
  if (command === 'truth') {
    const truth = truths[Math.floor(Math.random() * truths.length)]
    message = `🔍 *Truth*\n\n${truth}`
  } else if (command === 'dare') {
    const dare = dares[Math.floor(Math.random() * dares.length)]
    message = `🎯 *Dare*\n\n${dare}`
  } else {
    const isTruth = Math.random() < 0.5
    if (isTruth) {
      const truth = truths[Math.floor(Math.random() * truths.length)]
      message = `🔍 *Truth*\n\n${truth}`
    } else {
      const dare = dares[Math.floor(Math.random() * dares.length)]
      message = `🎯 *Dare*\n\n${dare}`
    }
  }
  
  m.reply(message)
}

handler.help = ['truth', 'dare', 'tod']
handler.tags = ['fun']
handler.command = ['truth', 'dare', 'tod', 'truthordare']
handler.desc = 'Get a random truth or dare'

export default handler
