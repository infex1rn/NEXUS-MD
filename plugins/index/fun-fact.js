/**
 * Fun Command: Random Fact
 * Get a random interesting fact
 */
const facts = [
  "Honey never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs that was still edible.",
  "Octopuses have three hearts and blue blood.",
  "A day on Venus is longer than a year on Venus.",
  "Bananas are berries, but strawberries aren't.",
  "The shortest war in history lasted 38-45 minutes between Britain and Zanzibar.",
  "A group of flamingos is called a 'flamboyance'.",
  "Cows have best friends and get stressed when separated.",
  "The inventor of the Pringles can is buried in one.",
  "Wombat poop is cube-shaped.",
  "The unicorn is Scotland's national animal.",
  "A jiffy is an actual unit of time: 1/100th of a second.",
  "The moon has moonquakes.",
  "Dolphins have names for each other.",
  "Sloths can hold their breath longer than dolphins can.",
  "The Eiffel Tower can grow by 6 inches in the summer due to heat expansion.",
  "A cloud can weigh more than a million pounds.",
  "Humans share 50% of their DNA with bananas.",
  "The heart of a shrimp is located in its head.",
  "A group of crows is called a murder.",
  "The shortest sentence using every letter of the alphabet is: 'Mr. Jock, TV quiz PhD, bags few lynx.'",
  "Butterflies taste with their feet.",
  "Sea otters hold hands while sleeping to avoid drifting apart.",
  "The longest hiccuping spree lasted 68 years.",
  "A snail can sleep for three years.",
  "Elephants are the only animals that can't jump.",
  "A bolt of lightning is six times hotter than the sun.",
  "The fingerprints of a koala are so similar to humans that they could taint crime scenes.",
  "Polar bears have black skin under their white fur.",
  "A giraffe's tongue is about 21 inches long.",
  "Cats have over 100 vocal sounds while dogs only have about 10."
]

let handler = async (m) => {
  const fact = facts[Math.floor(Math.random() * facts.length)]
  
  m.reply(`💡 *Random Fact*\n\n${fact}`)
}

handler.help = ['fact']
handler.tags = ['fun']
handler.command = ['fact', 'randomfact', 'funfact']
handler.desc = 'Get a random interesting fact'

export default handler
