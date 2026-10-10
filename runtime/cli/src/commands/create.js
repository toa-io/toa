export const builder = (yargs) => {
  yargs
    .positional('name', {
      type: 'string',
      desc: "The application's name"
    })
    .example([['$0 create store']])
}

// the handler and what it depends on load when the command runs, not when the program starts
export const handler = async (argv) => {
  const { create } = await import('../handlers/create.js')

  return await create(argv)
}

export const command = 'create <name>'
export const desc = 'Create an application in the working directory'
