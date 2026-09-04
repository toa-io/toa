import { it, describe } from 'node:test'
import assert from 'node:assert/strict'

import { execFile } from 'node:child_process'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)

const root = resolve(import.meta.dirname, 'dummies')
const source = (file) => pathToFileURL(resolve(import.meta.dirname, '..', 'src', file)).href

/**
 * The unit suite runs through `tsx`, which reads TypeScript itself and accepts what Node
 * refuses. Node is what runs a deployed component, so what it does is observed here, in a
 * process started without a loader.
 */
const node = async (script) => {
  const { stdout } = await run(process.execPath, ['--input-type=module', '--eval', script],
    { env: { ...process.env, NODE_OPTIONS: '' } })

  return stdout.trim()
}

describe('node reads TypeScript', () => {
  it('should strip types without a loader', async () => {
    assert.strictEqual(await node('console.log(process.features.typescript)'), 'strip')
  })

  // an operation's type and scope are read back from the loaded function, and Node leaves
  // whitespace where the annotations were, so what it hands back still parses as JavaScript
  it('should define an operation of each syntax', async () => {
    const printed = await node(`
      const { operations } = await import('${source('define/index.js')}')

      console.log(JSON.stringify(await operations('${resolve(root, 'typescript')}')))
    `)

    const operations = JSON.parse(printed)

    for (const name of ['fn', 'cls', 'fct'])
      assert.deepStrictEqual(operations[name], { type: 'transition', scope: 'object' })
  })

  it('should say which file is not erasable, and why', async () => {
    const printed = await node(`
      const { operation } = await import('${source('load.js')}')

      try {
        await operation('${resolve(root, 'nonerasable')}', 'transit')
        console.log('loaded')
      } catch (error) {
        console.log(error.message)
      }
    `)

    assert.match(printed, /transit\.ts/)
    assert.match(printed, /strip-only mode/)
    assert.match(printed, /erasable syntax only/)
  })
})
