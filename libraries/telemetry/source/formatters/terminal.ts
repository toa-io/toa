import type { Entry } from '../Console'

export function format (entry: Entry): Buffer {
  let message = `${entry.severity} ${entry.message}`

  if (entry.attributes !== undefined)
    message += '\n' + print(entry.attributes)

  if (entry.context !== undefined)
    message += '\n' + print(entry.context)

  return Buffer.from('---\n' + message + '\n')
}

function print (object: object): string {
  return Object.entries(object).map(([key, value]) =>
    `  ${key}: ${value as string}`).join('\n')
}
