'use strict'

const boot = require('@toa.io/boot')

const { component: find } = require('../util/find')

async function compose (argv) {
  const paths = find(argv.paths)

  if (paths === undefined) throw new Error(`No components found in ${argv.paths}`)

  const composition = await boot.composition(paths, argv)

  await composition.connect()
}

exports.compose = compose
