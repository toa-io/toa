/**
 * @param {string} command
 * @param {Record<string, any>} args
 */
export const command = (command, args) => {
  const options = []

  for (const [name, value] of Object.entries(args)) {
    if (value === undefined) continue

    // an option that takes several values is repeated, rather than joined into one
    for (const item of Array.isArray(value) ? value : [value]) {
      options.push('--' + name)

      if (typeof item !== 'boolean') options.push(`"${item}"`)
    }
  }

  const argumentLine = options.join(' ')

  return command + ' ' + argumentLine
}
