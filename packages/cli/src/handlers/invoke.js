'use strict'

const boot = require('@kookaburra/boot')
const { console } = require('@kookaburra/gears')
const { root } = require('../util/root')

async function invoke ({ path, operation, input }) {
  const dir = root(path)
  const runtime = await boot.runtime(dir)

  await runtime.connect()
  const io = await runtime.invoke(operation, input)
  await runtime.disconnect()

  if (io.error) { throw io.error }

  console.dir({ input: io.input, output: io.output })
}

exports.invoke = invoke
