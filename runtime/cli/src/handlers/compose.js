'use strict'

const boot = require('@toa.io/boot')

const { manifest: find } = require('../util/find')

async function compose (argv) {
  const paths = [...new Set(argv.paths.map(find))]
  const composition = await boot.composition(paths, argv)

  await composition.connect()
}

exports.compose = compose
