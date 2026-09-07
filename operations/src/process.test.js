import { it, describe } from 'node:test'
import assert from 'node:assert/strict'

import { Process } from './process.js'

describe('execute', () => {
  it('should answer what the command wrote', async () => {
    const output = await new Process().execute(
      'node',
      ['-e', 'process.stdout.write("ok")'],
      { silently: true }
    )

    assert.strictEqual(output, 'ok')
  })

  it('should reject what the command failed at, with what it wrote', async () => {
    await assert.rejects(
      new Process().execute(
        'node',
        ['-e', 'process.stderr.write("broken"); process.exit(2)'],
        { silently: true }
      ),
      (error) => /exit code 2: node/.test(error.message) && /broken/.test(error.message)
    )
  })

  it('should reject a command that does not exist', async () => {
    await assert.rejects(
      new Process().execute('toa-no-such-command', [], { silently: true })
    )
  })
})
