'use strict'

const boot = require('@kookaburra/boot')
const { root } = require('../util/root')
const { console } = require('../util/console')

async function handler ({ operation, input }) {
  const dir = root()
  const runtime = await boot.runtime(dir)

  await runtime.start()
  const io = await runtime.invoke(operation, input)
  await runtime.stop()

  console.dir({ input: io.input, output: io.output, error: io.error })
}

exports.handler = handler
