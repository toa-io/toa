'use strict'

const boot = require('@toa.io/boot')

const { Factory, PREFIX } = require('@toa.io/extensions.configuration')

const { subcommands } = require('./.configure/subcommands')
const { component: find } = require('../util/find')

async function configure (argv) {
  const path = find(argv.path)
  const component = await boot.component(path)
  const factory = new Factory()
  const provider = factory.provider(component)
  const KEY = PREFIX + component.locator.uppercase

  if (argv.value === undefined && subcommands[argv.key] !== undefined) {
    await subcommands[argv.key](provider, argv)

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
  }

  let command
  const exported = provider.export()

  if (exported === undefined) command = `unset ${KEY}`
  else command = `export ${KEY}=` + exported

  console.log(command)
}

exports.configure = configure
