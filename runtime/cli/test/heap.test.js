import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { accounts } from '../src/heap.js'

describe('whether buffer memory is to be counted in the heap limit', () => {
  for (const version of ['13.6.233.17-node.53', '14.6.202.34', '14.7.0'])
    it(`is, on V8 ${version}, where it is off by default`, () => {
      assert.ok(accounts(version))
    })

  for (const version of ['14.8.0', '14.10.1', '15.0.0'])
    it(`is not, on V8 ${version}, which has no such flag and does it anyway`, () => {
      assert.ok(!accounts(version))
    })
})

describe('buffers nothing keeps', () => {
  const churn = fileURLToPath(new URL('./heap/churn.js', import.meta.url))

  function run(...args) {
    return JSON.parse(execFileSync(process.execPath, [churn, ...args], { encoding: 'utf8' }))
  }

  // a V8 that counts them by itself has nothing to compare against
  it('start a quarter of the mark-compacts once they are counted', { skip: !accounts() }, () => {
    const stock = run()
    const accounted = run('accounted')
    const counts = JSON.stringify({ stock, accounted })

    // what is compared has to have happened: a run too short to start any proves nothing
    assert.ok(stock.major >= 8, counts)
    assert.ok(accounted.major * 4 <= stock.major, counts)
  })
})
