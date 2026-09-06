import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { load } from 'js-yaml'

/**
 * `authenticate` answers what `use` refuses with, as it is: it verifies nothing itself and
 * hands back the error it was given. A reply carrying an error the operation does not
 * declare is refused by the runtime, so the caller gets a `500` where they should have got
 * an answer — which is what happened when `use` learned to say `FAILED`.
 */
describe('identity.passkeys errors', () => {
  const manifest = load(
    readFileSync(new URL('../manifest.toa.yaml', import.meta.url), 'utf8')
  ) as Manifest

  it('should declare of `authenticate` everything `use` answers', () => {
    const { authenticate, use } = manifest.operations

    for (const code of use.errors)
      assert.ok(
        authenticate.errors.includes(code),
        `'authenticate' forwards '${code}' and does not declare it`
      )
  })

  it('should declare what it refuses with itself', () => {
    assert.ok(manifest.operations.authenticate.errors.includes('MISS'))
  })
})

interface Manifest {
  operations: Record<string, { errors: string[] }>
}
