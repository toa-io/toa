'use strict'

const boot = require('@kookaburra/boot')
const { root } = require('../util/root')

async function handler ({ operation, input }) {
  const dir = root()
  const runtime = await boot.runtime(dir)

  await runtime.start()
  const io = await runtime.invoke(operation, input)
  await runtime.stop()

  if (io.error) { console.log('error', io.error) } else if (Object.keys(io.output).length > 0) { console.log(io.output) }
}

exports.handler = handler
