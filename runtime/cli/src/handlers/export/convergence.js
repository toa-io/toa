import { context as load } from '@toa.io/norm'
import { commands, topology, vhost } from '@toa.io/definitions/extensions.convergence'
import { context as find } from '../../util/find.js'

const REFERENCE = '@toa.io/extensions.convergence'

/**
 * What the region's convergence broker must carry, printed rather than declared: the CLI has
 * no credentials for a broker — a pointer carries none and they are deployed as secrets — and
 * the region this prepares has nothing deployed on it yet.
 *
 * @param {{ path: string, environment: string, format: string }} argv
 * @returns {Promise<void>}
 */
export const convergence = async (argv) => {
  const path = find(argv.path)
  const context = await load(path, argv.environment)
  const annotation = context.annotations?.[REFERENCE]

  if (annotation === undefined)
    throw new Error(
      `Environment '${argv.environment}' declares no convergence, so it is not a region. ` +
        'A context declares one `convergence@<environment>` per region it is deployed as.'
    )

  // an evicted component is deployed by other means, and its broker is not this region's
  const labels = (context.dependencies?.[REFERENCE] ?? [])
    .filter((instance) => instance.component.evicted !== true)
    .map((instance) => instance.component.locator.id)

  const host = vhost(annotation.binding.pointer)

  if (argv.format === COMMANDS) for (const line of commands(labels, host)) console.log(line)
  else console.log(JSON.stringify(topology(labels, host), null, 2))

  hint(argv, labels)
}

/**
 * On stderr, so that redirecting the definitions to a file or piping them into the import
 * leaves both clean, and someone who just ran the command still reads what to do with it.
 */
function hint(argv, labels) {
  const what =
    labels.length === 1 ? '1 component converges' : `${labels.length} components converge`

  console.error(`\n# ${what} in '${argv.environment}'.`)

  if (argv.format === COMMANDS) return

  console.error(
    '# Declare them on that region\'s convergence broker, before its data is copied and\n' +
      '# before anything is deployed there:\n#\n' +
      `#   toa export convergence ${argv.environment} | curl -u <user>:<password> \\\n` +
      '#     -H \'content-type: application/json\' -X POST --data @- \\\n' +
      '#     http://<broker>:15672/api/definitions\n#\n' +
      '# The import adds and removes nothing, so it is safe to run again.'
  )
}

const COMMANDS = 'commands'
