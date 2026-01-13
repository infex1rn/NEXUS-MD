/**
 * Fun Command: Quotes
 * Get inspirational quotes
 */
const quotes = [
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { quote: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { quote: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { quote: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { quote: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { quote: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
  { quote: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
  { quote: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { quote: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { quote: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
  { quote: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
  { quote: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
  { quote: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { quote: "If you really look closely, most overnight successes took a long time.", author: "Steve Jobs" },
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { quote: "It's not whether you get knocked down, it's whether you get up.", author: "Vince Lombardi" },
  { quote: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar" },
  { quote: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { quote: "The mind is everything. What you think you become.", author: "Buddha" },
  { quote: "An unexamined life is not worth living.", author: "Socrates" },
  { quote: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama" }
]

let handler = async (m) => {
  const { quote, author } = quotes[Math.floor(Math.random() * quotes.length)]
  
  m.reply(`💭 *Quote of the Moment*\n\n"${quote}"\n\n— *${author}*`)
}

handler.help = ['quote', 'quotes']
handler.tags = ['fun']
handler.command = ['quote', 'quotes', 'motivation', 'inspire']
handler.desc = 'Get an inspirational quote'

export default handler
