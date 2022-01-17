'use strict'

const yargs = require('yargs/yargs')

const { console } = require('@toa.io/gears')
const { version } = require('../package.json')

yargs(process.argv.slice(2))
  .middleware((argv) => {
    if (argv.log === undefined) argv.log = 'info'

    console.level(argv.log)
  })
  .fail((msg, err) => {
    const actual = err || new Error(msg)

    console.error(actual)

    process.exit(actual.exitCode > 0 ? actual.exitCode : 1)
  })
  .option('log', {
    type: 'string',
    describe: 'Log level'
  })
  .commandDir('./commands')
  .demandCommand(1, 'A command is required. Pass --help to see all available commands and options.')
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
