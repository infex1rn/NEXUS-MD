/**
 * Fun Command: Joke
 * Get a random joke
 */
const jokes = [
  { setup: "Why don't scientists trust atoms?", punchline: "Because they make up everything!" },
  { setup: "Why did the scarecrow win an award?", punchline: "Because he was outstanding in his field!" },
  { setup: "Why don't eggs tell jokes?", punchline: "They'd crack each other up!" },
  { setup: "What do you call a fake noodle?", punchline: "An impasta!" },
  { setup: "Why did the bicycle fall over?", punchline: "Because it was two tired!" },
  { setup: "What do you call a bear with no teeth?", punchline: "A gummy bear!" },
  { setup: "Why can't you give Elsa a balloon?", punchline: "Because she will let it go!" },
  { setup: "What did the ocean say to the beach?", punchline: "Nothing, it just waved!" },
  { setup: "Why don't skeletons fight each other?", punchline: "They don't have the guts!" },
  { setup: "What do you call a fish without eyes?", punchline: "A fsh!" },
  { setup: "Why did the math book look so sad?", punchline: "Because it had too many problems!" },
  { setup: "What do you call a sleeping dinosaur?", punchline: "A dino-snore!" },
  { setup: "Why did the cookie go to the doctor?", punchline: "Because it felt crummy!" },
  { setup: "What do you call a boomerang that doesn't come back?", punchline: "A stick!" },
  { setup: "Why did the golfer bring two pairs of pants?", punchline: "In case he got a hole in one!" },
  { setup: "What did one wall say to the other?", punchline: "I'll meet you at the corner!" },
  { setup: "Why don't programmers like nature?", punchline: "It has too many bugs!" },
  { setup: "What's a computer's favorite snack?", punchline: "Microchips!" },
  { setup: "Why was the JavaScript developer sad?", punchline: "Because he didn't Node how to Express himself!" },
  { setup: "How do trees access the internet?", punchline: "They log in!" }
]

let handler = async (m) => {
  const joke = jokes[Math.floor(Math.random() * jokes.length)]
  
  await m.reply(`😄 *Joke*\n\n${joke.setup}`)
  
  // Wait 2 seconds before punchline
  setTimeout(async () => {
    await m.reply(`🎉 ${joke.punchline}`)
  }, 2000)
}

handler.help = ['joke']
handler.tags = ['fun']
handler.command = ['joke', 'jokes', 'dadjoke']
handler.desc = 'Get a random joke'

export default handler
