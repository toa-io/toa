'use strict'

const { Readable } = require('node:stream')
const boot = require('@toa.io/boot')
const yaml = require('@toa.io/yaml')
const { Locator } = require('@toa.io/core')

async function call (argv) {
  const [operation, component, namespace = 'default'] = argv.endpoint.split('.').reverse()
  const locator = new Locator(component, namespace)
  const request = argv.request ? yaml.parse(argv.request) : {}

  const remote = await boot.remote(locator)
  await remote.connect()

  let reply
  let exception

  try {
    reply = await remote.invoke(operation, request)
  } catch (e) {
    exception = e
  } finally {
    if (exception === undefined) {
      if (reply instanceof Readable) {
        for await (const chunk of reply) console.log(chunk)
      } else console.log(reply)
    } else console.error(exception)

    await remote.disconnect()

    if (exception !== undefined) process.exit(1)
  }
}

exports.call = call
