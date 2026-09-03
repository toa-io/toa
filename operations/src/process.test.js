import { it, describe } from 'node:test'
import assert from 'node:assert/strict'

import { Process } from './process.js'

describe('execute', () => {
  it('should answer what the command wrote', async () => {
    // `execa` is a named export, and calling the module namespace instead answers
    // `execa is not a function` — where only a deployment would have found out
    const output = await new Process().execute('node', ['-e', 'process.stdout.write("ok")'],
      { silently: true })

    assert.strictEqual(output, 'ok')
  })

  it('should reject what the command failed at', async () => {
    await assert.rejects(new Process().execute('node', ['-e', 'process.exit(1)'],
      { silently: true }))
  })
})
