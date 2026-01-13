/**
 * Utility Command: Calculate
 * Simple calculator using safe math evaluation
 */
let handler = async (m, { text, usedPrefix, command }) => {
  if (!text) throw `*Please provide a math expression!*\n\nExample: *${usedPrefix}${command} 2 + 2*\n\nSupported: +, -, *, /, ^, (), sqrt, sin, cos, tan, log, abs, pi, e`
  
  try {
    // Sanitize input - only allow safe math characters and functions
    const sanitized = text
      .trim()
      .replace(/x/gi, '*')
      .replace(/÷/g, '/')
      .replace(/×/g, '*')
      .replace(/\^/g, '**')
    
    // Strict allowlist of safe characters
    if (!/^[0-9+\-*/().%\s]+$/i.test(sanitized.replace(/sqrt|sin|cos|tan|log|abs|pi|e/gi, ''))) {
      throw new Error('Invalid characters in expression')
    }
    
    // Block dangerous patterns
    if (/[a-z_$][a-z0-9_$]*\s*\(/i.test(sanitized.replace(/sqrt|sin|cos|tan|log|abs/gi, ''))) {
      throw new Error('Function calls not allowed')
    }
    
    // Manually evaluate safe expressions using a simple parser
    const result = evaluateSafeExpression(sanitized)
    
    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error('Invalid result')
    }
    
    m.reply(`🧮 *Calculator*\n\n📝 Expression: ${text}\n✅ Result: *${result}*`)
    
  } catch (e) {
    m.reply(`❌ Error: Could not calculate "${text}"\n\nMake sure your expression is valid.`)
  }
}

/**
 * Safe expression evaluator using only basic arithmetic
 */
function evaluateSafeExpression(expr) {
  // Replace math constants
  let processed = expr
    .replace(/\bpi\b/gi, String(Math.PI))
    .replace(/\be\b/gi, String(Math.E))
  
  // Handle math functions safely
  processed = processed.replace(/sqrt\s*\(\s*([0-9.]+)\s*\)/gi, (_, n) => String(Math.sqrt(parseFloat(n))))
  processed = processed.replace(/sin\s*\(\s*([0-9.]+)\s*\)/gi, (_, n) => String(Math.sin(parseFloat(n))))
  processed = processed.replace(/cos\s*\(\s*([0-9.]+)\s*\)/gi, (_, n) => String(Math.cos(parseFloat(n))))
  processed = processed.replace(/tan\s*\(\s*([0-9.]+)\s*\)/gi, (_, n) => String(Math.tan(parseFloat(n))))
  processed = processed.replace(/log\s*\(\s*([0-9.]+)\s*\)/gi, (_, n) => String(Math.log10(parseFloat(n))))
  processed = processed.replace(/abs\s*\(\s*(-?[0-9.]+)\s*\)/gi, (_, n) => String(Math.abs(parseFloat(n))))
  
  // Validate only safe characters remain
  if (!/^[0-9+\-*/().%\s]+$/.test(processed)) {
    throw new Error('Expression contains invalid characters after processing')
  }
  
  // Use a simple recursive descent parser for safety
  return parseExpression(processed.replace(/\s/g, ''))
}

function parseExpression(expr) {
  let pos = 0
  
  function parseNumber() {
    let start = pos
    if (expr[pos] === '-' || expr[pos] === '+') pos++
    while (pos < expr.length && (/[0-9.]/.test(expr[pos]))) pos++
    return parseFloat(expr.slice(start, pos))
  }
  
  function parseFactor() {
    if (expr[pos] === '(') {
      pos++ // skip (
      let result = parseAddSub()
      pos++ // skip )
      return result
    }
    return parseNumber()
  }
  
  function parsePower() {
    let left = parseFactor()
    while (expr.slice(pos, pos + 2) === '**') {
      pos += 2
      left = Math.pow(left, parseFactor())
    }
    return left
  }
  
  function parseMulDiv() {
    let left = parsePower()
    while (expr[pos] === '*' || expr[pos] === '/' || expr[pos] === '%') {
      let op = expr[pos++]
      let right = parsePower()
      if (op === '*') left *= right
      else if (op === '/') left /= right
      else left %= right
    }
    return left
  }
  
  function parseAddSub() {
    let left = parseMulDiv()
    while (expr[pos] === '+' || (expr[pos] === '-' && pos > 0)) {
      let op = expr[pos++]
      let right = parseMulDiv()
      if (op === '+') left += right
      else left -= right
    }
    return left
  }
  
  return parseAddSub()
}

handler.help = ['calc <expression>', 'math <expression>']
handler.tags = ['utility']
handler.command = ['calc', 'calculate', 'math', 'kalkulator']
handler.desc = 'Calculate math expressions'

export default handler
