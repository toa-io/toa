'use strict'

const boot = require('@kookaburra/boot')
const { console } = require('@kookaburra/gears')
const { root } = require('../util/root')

async function handler ({ operation, input }) {
  const dir = root()
  const runtime = await boot.runtime(dir)

  await runtime.connect()
  const io = await runtime.invoke(operation, input)
  await runtime.disconnect()

  console.dir({ input: io.input, output: io.output, error: io.error })
}

exports.handler = handler
