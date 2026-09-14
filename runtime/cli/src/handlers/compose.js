import { console as output } from 'openspan'
import { environment, pick } from '@toa.io/generic'
import { Connector } from '@toa.io/core'
import * as boot from '@toa.io/boot'
import { MAP, version } from '@toa.io/definitions'

import { map } from '../util/map.js'
import { graceful } from './lib/graceful.js'
import { create } from './lib/services.js'
import { components as find } from '../util/find.js'
import { needs, OPERATIONS } from '../util/needs.js'

/**
 * @param {Record<string, string | boolean>} argv
 * @return {Promise<void>}
 */
export async function compose(argv) {
  console.log('Runtime', version)

  if (argv.dock === true) return dock(argv)

  boot.map.use(map(argv))

  const paths = find(argv.paths)
  const references = services(argv)

  // what the command runs is behind a gate, so a halt takes it down and builds it again from
  // these same arguments; a service says for itself what a halt takes of it
  const workload = new boot.Workload(async (workload) => {
    const composition = workload.gate(async () => await boot.composition(paths, argv))

    if (references.length === 0) return composition

    const root = new Connector()

    root.depends([composition, ...(await create(references, false, workload))])

    return root
  })

  const start = async () => {
    graceful(workload)

    await workload.connect()
  }

  // the trace of the startup
  if (environment.get('TOA_BOOT_TRACE') === '1') await output.span('toa compose', start)
  else await start()

  if (argv.kill === true) await workload.disconnect()
}

/**
 * The deployment states them in the environment, so the image is the same whichever
 * services a composition runs; a local run states them on the command line.
 *
 * @param {Record<string, string | string[] | boolean>} argv
 * @return {string[]}
 */
function services(argv) {
  if (argv.service !== undefined) return argv.service

  const variable = environment.get('TOA_SERVICES')?.trim()

  return variable === undefined || variable === '' ? [] : variable.split(/\s+/)
}

/**
 * @param {Record<string, string | string[] | boolean>} argv
 * @return {Promise<void>}
 */
async function dock(argv) {
  // the image is built with the deployment package, which a plain run never needs
  const docker = await needs(
    'compose --dock',
    () => import('./docker/index.js'),
    OPERATIONS
  )
  const repository = await docker.build(argv.context, argv.paths)
  const args = pick(argv, ['kill', 'service'])
  const file = map(argv)

  // the container is given its own command, so the image's — which names the map — is not used
  const command =
    docker.command('toa compose *', args) + (file === undefined ? '' : ` --map ${MAP}`)

  await docker.run(repository, command, argv.env, file)
}
