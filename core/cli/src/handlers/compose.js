'use strict'

const boot = require('@kookaburra/boot')
const { tryRoot } = require('../util/root')

async function compose (argv) {
  // resolve unique valid roots
  const paths = [...new Set(argv.path.map(tryRoot))]
  const composition = await boot.composition(paths)

  await composition.connect()
}

exports.compose = compose
