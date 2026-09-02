import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const { version } = JSON.parse(readFileSync(join(import.meta.dirname, 'package.json'), 'utf8'))

export { version }
