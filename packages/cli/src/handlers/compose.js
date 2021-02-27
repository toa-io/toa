'use strict'

const boot = require('@kookaburra/boot')
const { tryRoot } = require('../util/root')

async function handler (argv) {
  // resolve unique valid roots
  const paths = [...new Set(argv.path.map(tryRoot).filter((path) => path))]
  const composition = await boot.composition(paths, { http: argv.http })

  await composition.connect()
}

exports.handler = handler
