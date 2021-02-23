'use strict'

const { root } = require('../util/root')
const boot = require('@kookaburra/boot')

async function handler (argv) {
  const dir = root()
  const runtime = await boot.runtime(dir)

  await runtime.start()
  const io = await runtime.invoke(argv.operation)
  await runtime.stop()

  if (io.error) { throw io.error } else if (Object.keys(io.output) > 0) { console.log(io.output) }
}

exports.handler = handler
