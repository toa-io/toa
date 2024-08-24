import * as util from 'node:util'
import chalk from 'chalk'

import type { Entry, Severity } from '../Console'

export const name = 'terminal'

export function format (entry: Entry): Buffer {
  const severity = chalk[COLORS[entry.severity]](entry.severity)

  let message = `${severity} ${entry.message}`

  if (entry.attributes !== undefined && Object.keys(entry.attributes).length > 0)
    message += '\n' + print(entry.attributes)

  if (entry.context !== undefined && Object.keys(entry.context).length > 0)
    message += '\n' + print(entry.context)

  return Buffer.from(message + '\n')
}

function print (value: any): string {
  return PAD + util.format(value).split('\n').join('\n' + PAD)
}

const PAD = '  '

const COLORS: Record<Severity, 'green' | 'blue' | 'yellow' | 'red'> = {
  DEBUG: 'green',
  INFO: 'blue',
  WARN: 'yellow',
  ERROR: 'red'
}
