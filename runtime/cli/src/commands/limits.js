// the handler and what it depends on load when the command runs, not when the program starts
const handler = async (argv) => {
  const { limits } = await import('../handlers/limits.js')

  return await limits(argv)
}

export const command = 'limits'
export const desc = 'Get resource limits for all pods in the current Kubernetes context'

export { handler }
