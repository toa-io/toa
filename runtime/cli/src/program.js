// noinspection JSUnresolvedVariable

import yargs from 'yargs/yargs'

import { environment } from '@toa.io/generic'
import * as boot from '@toa.io/boot'
import { version } from '@toa.io/definitions'

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

    boot.env(/** @type {string} */ argv.env)
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

process.on('unhandledRejection', (e) => {
  console.error(e)
  process.exit(1)
})
