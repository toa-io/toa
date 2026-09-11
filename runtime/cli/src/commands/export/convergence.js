export const builder = (yargs) => {
  yargs
    .positional('environment', {
      type: 'string',
      desc: 'Deployment environment, which is the region being prepared'
    })
    .option('path', {
      alias: 'p',
      group: 'Command options:',
      type: 'string',
      desc: 'Path to context',
      default: '.'
    })
    .option('format', {
      group: 'Command options:',
      type: 'string',
      choices: ['definitions', 'commands'],
      desc: 'What to print: broker definitions, or rabbitmqadmin invocations',
      default: 'definitions'
    })
    .example(
      '$0 export convergence eu | curl -u admin:$PASSWORD -X POST ' +
        "-H 'content-type: application/json' --data @- http://localhost:15672/api/definitions",
      'Declare what the region needs on its convergence broker'
    )
}

export const command = ['convergence <environment>']
export const desc = 'Export what a region needs on its convergence broker'

// the handler and what it depends on load when the command runs, not when the program starts
export const handler = async (argv) => {
  const { convergence } = await import('../../handlers/export/convergence.js')

  return await convergence(argv)
}
