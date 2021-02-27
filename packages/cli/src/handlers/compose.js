'use strict'

const path = require('path')

const boot = require('@kookaburra/boot')
const { console } = require('@kookaburra/gears')
const { tryRoot } = require('../util/root')
const { watch } = require('../util/watch')

let watcher

async function handler (argv) {
  argv.http.tentative = argv.watch

  // resolve unique valid roots
  const paths = [...new Set(argv.path.map(tryRoot).filter((path) => path))]
  const composition = await boot.composition(paths, { http: argv.http })

  await composition.connect()

  if (argv.watch) {
    if (!watcher) {
      watcher = watch(paths)
      console.info('Watching changes in', paths.map(p => path.relative(process.cwd(), p) || '.').join(', '))
    }

    watcher.handler = async () => {
      watcher.restarts++
      console.info(`Change detected, restarting (${watcher.restarts})...`)

      await composition.disconnect()

      handler(argv).then()
    }
  }
}

exports.handler = handler
