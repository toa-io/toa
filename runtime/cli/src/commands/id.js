// the handler and what it depends on load when the command runs, not when the program starts
const handler = async (argv) => {
  const { id } = await import('../handlers/id.js')

  return await id(argv)
}

export const command = 'id'
export const desc = false

export { handler }
