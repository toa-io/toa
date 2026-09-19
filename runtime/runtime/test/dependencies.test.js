import { it } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

import { DEFINED } from '@toa.io/definitions'

const require = createRequire(import.meta.url)

const manifest = JSON.parse(
  readFileSync(require.resolve('@toa.io/runtime/package.json'), 'utf8')
)

/*
`@toa.io/extensions.cadence` was defined here and installed by nothing for as long as it has
existed: a workspace resolves it by symlink, so every suite passed, and an application that
declared `cadence:` failed to boot on an image that never had it.
*/
it('installs every package the definitions define', () => {
  const missing = [...DEFINED].filter(
    (suffix) => !(`@toa.io/${suffix}` in manifest.dependencies)
  )

  assert.deepEqual(missing, [], 'defined and not installed by the runtime')
})

/*
Not at the runtime's own version: `lerna` bumps what changed and what depends on it, so a
package nothing touched stays where the release before left it.
*/
it('installs them at a version', () => {
  for (const suffix of DEFINED)
    assert.match(
      manifest.dependencies[`@toa.io/${suffix}`],
      /^\d+\.\d+\.\d+/,
      `@toa.io/${suffix}`
    )
})
