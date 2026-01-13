/**
 * Utility Command: Calculate
 * Simple calculator
 */
let handler = async (m, { text, usedPrefix, command }) => {
  if (!text) throw `*Please provide a math expression!*\n\nExample: *${usedPrefix}${command} 2 + 2*\n\nSupported: +, -, *, /, ^, (), sqrt(), sin(), cos(), tan(), log(), abs()`
  
  try {
    // Sanitize input - only allow safe math characters
    const sanitized = text
      .replace(/\s+/g, '')
      .replace(/x/gi, '*')
      .replace(/÷/g, '/')
      .replace(/×/g, '*')
      .replace(/\^/g, '**')
    
    // Check for invalid characters
    if (!/^[0-9+\-*/().%sqrt,sincotan logabspiePIE\s]+$/i.test(sanitized)) {
      throw new Error('Invalid characters in expression')
    }
    
    // Replace math functions
    const expression = sanitized
      .replace(/sqrt\(/gi, 'Math.sqrt(')
      .replace(/sin\(/gi, 'Math.sin(')
      .replace(/cos\(/gi, 'Math.cos(')
      .replace(/tan\(/gi, 'Math.tan(')
      .replace(/log\(/gi, 'Math.log10(')
      .replace(/abs\(/gi, 'Math.abs(')
      .replace(/pi/gi, 'Math.PI')
      .replace(/e(?![a-z])/gi, 'Math.E')
    
    // Evaluate safely
    const result = Function(`'use strict'; return (${expression})`)()
    
    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error('Invalid result')
    }
    
    m.reply(`🧮 *Calculator*\n\n📝 Expression: ${text}\n✅ Result: *${result}*`)
    
  } catch (e) {
    m.reply(`❌ Error: Could not calculate "${text}"\n\nMake sure your expression is valid.`)
  }
}

handler.help = ['calc <expression>', 'math <expression>']
handler.tags = ['utility']
handler.command = ['calc', 'calculate', 'math', 'kalkulator']
handler.desc = 'Calculate math expressions'

export default handler
