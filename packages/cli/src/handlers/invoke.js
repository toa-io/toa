'use strict'

const boot = require('@kookaburra/boot')
const rjosn = require('relaxed-json')

const { root } = require('../util/root')
const { output } = require('../util/output')

async function invoke (argv) {
  const runtime = await boot.runtime(root(argv.path))

  const input = argv.input ? JSON.parse(rjosn.transform(argv.input)) : null
  const query = argv.query ? JSON.parse(rjosn.transform(argv.query)) : null

  await runtime.connect()
  const io = await runtime.invoke(argv.operation, input, query)
  await runtime.disconnect()

  if (io.error) { throw io.error }

  output({ input: io.input, output: io.output }, argv)
}

exports.invoke = invoke
