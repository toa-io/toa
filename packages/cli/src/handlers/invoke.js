'use strict'

const boot = require('@kookaburra/boot')
const rjosn = require('relaxed-json')

const { root } = require('../util/root')
const { print } = require('../util/print')

async function invoke (argv) {
  const runtime = await boot.runtime(root(argv.path), { mono: true })

  const input = argv.input ? JSON.parse(rjosn.transform(argv.input)) : null
  const query = argv.query ? JSON.parse(rjosn.transform(argv.query)) : null

  await runtime.connect()
  const [output, error] = await runtime.invoke(argv.operation, input, query)
  await runtime.disconnect()

  if (error) { throw error }

  print(output, argv)
}

exports.invoke = invoke
