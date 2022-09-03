'use strict'

const { component } = require('@toa.io/userland/samples')
const find = require('../util/find')

async function replay (argv) {
  const path = find.component(argv.path)

  await component(path)
}

exports.replay = replay
