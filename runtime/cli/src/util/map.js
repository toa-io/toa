import { findUp } from '@toa.io/generic'

/**
 * The file this process reads the version of a component from, as the command was given it or as
 * it is found from the working directory upwards — the way `.env` is found.
 *
 * A run is refused where a Context is there and its map is not, unlike `.env`, which is optional:
 * a run with no variables is something someone may mean, while a process with no map asks
 * whichever replica of a component answers first, which during a deployment is not necessarily
 * the one it is meant to read.
 *
 * A component run outside a Context has no peers a map could name, and needs none.
 *
 * @param {Record<string, unknown>} argv
 * @returns {string | undefined}
 */
export function map(argv) {
  if (typeof argv.map === 'string') return argv.map

  const found = findUp(FILE)

  if (found !== undefined) return found

  if (findUp(CONTEXT) === undefined) return undefined

  throw new Error(
    `Cannot find '${FILE}' from '${process.cwd()}'. ` +
      'Run `toa map` to write one, or name one with `--map`.'
  )
}

const FILE = '.map.json'
const CONTEXT = 'context.toa.yaml'
