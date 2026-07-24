'use strict'

/**
 * Removes leading/trailing blank lines and dedents by the first line's padding.
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

  if (padding === '')
    return lines.join('\n')

  return lines
    .map((line) => line.startsWith(padding) ? line.slice(padding.length) : line)
    .join('\n')
}

exports.trim = trim
