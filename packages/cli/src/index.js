const { program } = require('commander');

const pack = require('../package');
const action = require('./action');
const invoke = require('./commands/invoke');
const http = require('./commands/http');

program
    .name('koo')
    .version(pack.version, '-v, --version', 'output current version')
    .option('-d, --debug', 'output extra debugging');

program
    .command('invoke <component> <operation> [input] [query]')
    .description('invoke operation')
    .action(action(invoke));

program
    .command('http <component>')
    .description('start http server')
    .action(action(http));

program.parse(process.argv);
