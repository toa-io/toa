'use strict'

/**
 * @param {string} command
 * @param {Record<string, any>} args
 */
const command = (command, args) => {
  const options = []

  for (const [name, value] of Object.entries(args)) {
    if (value === undefined) continue

    options.push('--' + name)

    if (typeof value !== 'boolean') options.push(`"${value}"`)
  }

  const argumentLine = options.join(' ')

  return command + ' ' + argumentLine
}

exports.command = command
