'use strict'

const path = require('path')
const watch = require('glob-watcher')

function watches (paths, handler) {
  const watcher = { handler, restarts: 0 }

  const globs = paths.map(glob =>
    INCLUSIONS.map(pattern => path.resolve(glob, pattern))
      .concat(EXCLUSIONS.map(pattern => `!${path.resolve(glob, pattern)}`))
  ).flat()

  watch(globs, async () => {
    if (watcher.handler) {
      await watcher.handler()
    }
  })

  return watcher
}

const INCLUSIONS = ['**/*.js', '**/operations/*.yaml', '**/kookaburra.yaml']
const EXCLUSIONS = ['**/test/']

exports.watch = watches
