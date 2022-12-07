'use strict'

const boot = require('@toa.io/boot')

const { component: find } = require('../util/find')

async function compose (argv) {
  const paths = find(argv.paths)
  const composition = await boot.composition(paths, argv)

  await composition.connect()
}

exports.compose = compose
