const builder = (yargs) => yargs
  .commandDir('./export')
  .demandCommand()

export const command = 'export <artifact>'
export const desc = 'Export internal artifacts'

export { builder }
