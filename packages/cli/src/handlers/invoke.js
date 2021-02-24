'use strict'

const { root } = require('../util/root')
const boot = require('@kookaburra/boot')

async function handler ({ operation, input }) {
  const dir = root()
  const runtime = await boot.runtime(dir)

  await runtime.start()
  const io = await runtime.invoke(operation, input)
  await runtime.stop()

  if (io.error) { console.error(io.error) } else if (Object.keys(io.output).length > 0) { console.log(io.output) }
}

exports.handler = handler
