import { it } from 'node:test'
import assert from 'node:assert/strict'

import { toBytes } from './bytes.js'

it('should parse bytes', async () => {
  assert.strictEqual(toBytes('10'), 10)
  assert.strictEqual(toBytes('10B'), 10)
})

it('should parse binary prefix', async () => {
  assert.strictEqual(toBytes('10KiB'), 10240)
  assert.strictEqual(toBytes('10MiB'), 10485760)
  assert.strictEqual(toBytes('10GiB'), 10737418240)
  assert.strictEqual(toBytes('10TiB'), 10995116277760)
})

it('should parse decimal prefix', async () => {
  assert.strictEqual(toBytes('10kB'), 10000)
  assert.strictEqual(toBytes('10MB'), 10000000)
  assert.strictEqual(toBytes('10GB'), 10000000000)
  assert.strictEqual(toBytes('10TB'), 10000000000000)
})

it('should parse incorrect value as binary', async () => {
  assert.strictEqual(toBytes('10b'), 10)
  assert.strictEqual(toBytes('10kb'), 10240)
  assert.strictEqual(toBytes('10kib'), 10240)
  assert.strictEqual(toBytes('10mb'), 10485760)
  assert.strictEqual(toBytes('10gb'), 10737418240)
  assert.strictEqual(toBytes('10tib'), 10995116277760)
  assert.strictEqual(toBytes('10Mb'), 10485760)
})
