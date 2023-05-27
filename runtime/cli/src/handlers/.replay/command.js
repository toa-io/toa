'use strict'

/**
 * @param {Record<string, any>} argv
 */
const command = (argv) => {
  const values = pick(argv)

  return format(values)
}

function pick (argv) {
  const { component, operation, integration, title } = argv
  return { component, operation, integration, title }
}

function format (values) {
  const args = []

  for (const [name, value] of Object.entries(values)) {
    if (value === undefined) continue

    args.push('--' + name)

    if (typeof value !== 'boolean') args.push(`"${value}"`)
  }

  const argumentsString = args.join(' ')

  return COMMAND + argumentsString
}

const COMMAND = 'toa replay * '

exports.command = command
