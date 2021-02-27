'use strict'

const path = require('path')

const boot = require('@kookaburra/boot')
const { root } = require('../util/root')

async function handler (argv) {
  const paths = argv.path.map(dir => path.resolve(dir)).map(root)
  const composition = await boot.composition(paths, { http: argv.http })

  await composition.connect()
}

exports.handler = handler
