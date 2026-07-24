'use strict'

/**
 * Removes leading/trailing blank lines, dedents by the first line's padding,
 * and strips trailing whitespace from each line.
 *
 * @param {string} input
 * @return {string}
 */
function trim (input) {
  const lines = input.split('\n')

  while (lines.length > 0 && lines[0].trim() === '')
    lines.shift()

  while (lines.length > 0 && lines[lines.length - 1].trim() === '')
    lines.pop()

  if (lines.length === 0)
    return ''

  const match = lines[0].match(/^\s*/)
  const padding = match === null ? '' : match[0]

  return lines
    .map((line) => {
      if (padding !== '' && line.startsWith(padding))
        line = line.slice(padding.length)

      return line.trimEnd()
    })
    .join('\n')
}

exports.trim = trim
