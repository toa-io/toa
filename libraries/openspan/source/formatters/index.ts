import * as json from './json'
import * as terminal from './terminal'
import type { Entry } from '../Console'

export const formatters: Record<Format, Formatter> = { json, terminal }

export interface Formatter {
  name: Format
  format: (entry: Entry) => Buffer
}

export type Format = 'json' | 'terminal'
