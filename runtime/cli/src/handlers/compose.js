'use strict'

const boot = require('@kookaburra/boot')
const { root } = require('../util/root')

async function compose (argv) {
  const paths = [...new Set(argv.paths.map(root))]
  const composition = await boot.composition(paths)

  await composition.connect()
}

exports.compose = compose
