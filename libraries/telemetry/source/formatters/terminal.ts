import type { Entry } from '../Console'

export const name = 'terminal'

export function format (entry: Entry): Buffer {
  let message = `${entry.severity} ${entry.message}`

  if (entry.attributes !== undefined)
    message += '\n' + print(entry.attributes)

  if (entry.context !== undefined)
    message += '\n' + print(entry.context)

  return Buffer.from(message + '\n')
}

function print (object: object, level = 1): string {
  const lines = []

  const pad = PAD.repeat(level)

  for (const [key, value] of Object.entries(object))
    if (value?.constructor === Object)
      lines.push(`${pad}${key}:\n${print(value, level + 1)}`)
    else
      lines.push(`${pad}${key}: ${value.toString()}`)

  return lines.join('\n')
}

const PAD = '  '
