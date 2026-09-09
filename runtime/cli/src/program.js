// noinspection JSUnresolvedVariable

import { readFileSync } from 'node:fs'
import dotenv from 'dotenv'
import yargs from 'yargs/yargs'
import { flush } from 'openspan'

import { environment, findUp } from '@toa.io/generic'
import { version } from '@toa.io/definitions'

/*
 * A local run reads what `toa env` wrote, the way a booting process does (`@toa.io/boot`,
 * `env.js`): into the environment store, never into `process.env`. Read here as well, because
 * a deploy has no runtime beside it to read the file, and its variables are what it deploys.
 */
const found = findUp('.env')

if (found !== undefined) load(found)

yargs(process.argv.slice(2))
  .parserConfiguration({
    'boolean-negation': false
  })
  .middleware((argv) => {
    if (argv.log === undefined)
      argv.log = environment.get('TOA_DEBUG') === '1' ? 'debug' : 'info'
  })
  .middleware(async (argv) => {
    if (argv.env === undefined) return

    load(/** @type {string} */ argv.env)
  })
  .fail((msg, err) => {
    const actual = err || new Error(msg)

    console.error(actual)

    process.exit(actual.exitCode > 0 ? actual.exitCode : 1)
  })
  .option('log', {
    describe: 'Log level'
  })
  .option('wtf', {
    describe: 'Enable wtf'
  })
  .option('env', {
    type: 'string',
    describe: 'Path to environment variables file (.env format)'
  })
  .commandDir('./commands')
  .demandCommand(
    1,
    'A command is required. Pass --help to see all available commands and options.'
  )
  .strict()
  .help()
  .version(version)
  .alias('h', 'help')
  .alias('v', 'version')
  .parse()

/*
 * The last resort, and nothing else: a rejection nobody handled says the process is in a state
 * nobody described, so it leaves rather than carries on. It leaves with its spans, though —
 * what explains the rejection is in the ones not exported yet, and `process.exit()` emits no
 * `beforeExit` to flush them. Flushing is bounded by the exporter's own request timeout and
 * never rejects, so it cannot keep a broken process alive.
 */
process.on('unhandledRejection', async (e) => {
  console.error(e)

  await flush()

  process.exit(1)
})

function load(path) {
  environment.absorbEntries(dotenv.parse(readFileSync(path, 'utf8')))
}
