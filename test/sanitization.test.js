import { prepareForFirebase, restoreFromFirebase } from '../lib/firebase.js'
import assert from 'assert'

console.log('Running sanitization tests...')

// Test case 1: Plain object
const plainObj = { a: 1, b: 'string', c: true }
const preparedPlain = prepareForFirebase(plainObj)
assert.deepStrictEqual(preparedPlain, plainObj, 'Plain object should remain unchanged')
console.log('✓ Test case 1: Plain object passed')

// Test case 2: Buffer
const buffer = Buffer.from('hello world')
const preparedBuffer = prepareForFirebase({ data: buffer })
assert.strictEqual(preparedBuffer.data._type, 'Buffer')
assert.strictEqual(typeof preparedBuffer.data.data, 'string')
const restoredBuffer = restoreFromFirebase(preparedBuffer)
assert.ok(Buffer.isBuffer(restoredBuffer.data), 'Restored should be a Buffer')
assert.strictEqual(restoredBuffer.data.toString(), 'hello world', 'Restored content should match')
console.log('✓ Test case 2: Buffer passed')

// Test case 3: TypedArray (Uint8Array)
const uint8 = new Uint8Array([1, 2, 3])
const preparedUint8 = prepareForFirebase({ data: uint8 })
assert.strictEqual(preparedUint8.data._type, 'Buffer')
const restoredUint8 = restoreFromFirebase(preparedUint8)
assert.ok(Buffer.isBuffer(restoredUint8.data), 'Restored Uint8Array should be a Buffer')
assert.deepStrictEqual(Array.from(restoredUint8.data), [1, 2, 3])
console.log('✓ Test case 3: Uint8Array passed')

// Test case 4: Class instance (non-standard prototype)
class TestClass {
  constructor() {
    this.name = 'test'
  }
  method() {}
}
const instance = new TestClass()
const preparedInstance = prepareForFirebase({ instance })
assert.strictEqual(preparedInstance.instance.name, 'test')
assert.strictEqual(preparedInstance.instance.method, undefined, 'Methods should be stripped')
// Check if it's a plain object (constructor should be Object)
assert.strictEqual(preparedInstance.instance.constructor, Object)
console.log('✓ Test case 4: Class instance passed')

// Test case 5: Nested structure
const nested = {
  a: {
    b: Buffer.from('nested'),
    c: [1, Buffer.from('array')]
  }
}
const preparedNested = prepareForFirebase(nested)
const restoredNested = restoreFromFirebase(preparedNested)
assert.ok(Buffer.isBuffer(restoredNested.a.b))
assert.ok(Buffer.isBuffer(restoredNested.a.c[1]))
assert.strictEqual(restoredNested.a.b.toString(), 'nested')
assert.strictEqual(restoredNested.a.c[1].toString(), 'array')
console.log('✓ Test case 5: Nested structure passed')

// Test case 6: Functions
const withFunc = {
  a: 1,
  b: () => console.log('hello')
}
const preparedFunc = prepareForFirebase(withFunc)
assert.strictEqual(preparedFunc.a, 1)
assert.strictEqual(preparedFunc.b, undefined, 'Functions should be stripped')
console.log('✓ Test case 6: Functions passed')

console.log('All sanitization tests passed!')
