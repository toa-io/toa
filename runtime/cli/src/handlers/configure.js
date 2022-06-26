'use strict'

const boot = require('@toa.io/boot')
const { dump } = require('@toa.io/libraries/yaml')

const { Factory, PREFIX } = require('@toa.io/extensions.configuration')

const { component: find } = require('../util/find')

async function configure (argv) {
  const path = find(argv.path)
  const component = await boot.component(path)
  const factory = new Factory()
  const provider = factory.provider(component)
  const KEY = PREFIX + component.locator.uppercase

  if (argv.value === undefined && subcommands[argv.key] !== undefined) {
    await subcommands[argv.key](provider)

    return
  }

  await provider.connect()

  let key = argv.key
  let value = argv.value

  // :(
  if (key !== undefined) {
    if (value === undefined && key.includes('=')) [key, value] = key.split('=')

    if (value === undefined) {
      if (argv.reset !== true) throw new Error('Key value expected')
      else provider.unset(key)
    } else provider.set(key, value)
  } else {
    if (provider.object !== undefined) console.log(dump(provider.object))

    return
  }

  let command
  const exported = provider.export()

  if (exported === undefined) command = `unset ${KEY}`
  else command = `export ${KEY}=` + exported

  console.log(command)
}

const subcommands = {
  reset: (provider) => console.log('unset ' + provider.key),
  print: async (provider) => {
    await provider.connect()

    console.log(dump(provider.object))
  }
}

exports.configure = configure
