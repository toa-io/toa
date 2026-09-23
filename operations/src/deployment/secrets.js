/**
 * What the cluster has to hold for a deployment to run, and the refusal where it does not.
 *
 * A pod whose secret is not there is never created, and nothing the chart carries says so: Helm
 * reports a release, the rollout stalls, and the name of what is missing is in the events of a pod
 * that does not exist. The cluster answers the question before any of that, for one call.
 */

/**
 * Every secret the workloads read, as `<name>/<key>`, and the image pull secret by name alone —
 * what it holds is the registry's affair, and its absence stops a pod just the same.
 *
 * @param {toa.deployment.dependency.Variable[]} variables
 * @param {string} [credentials] `registry.credentials`
 * @returns {string[]}
 */
export function references(variables, credentials) {
  /** @type {string[]} */
  const references = []

  // as the chart renders it: `imagePullSecrets` is there where the name is, and a context
  // that states the key and no name names no secret
  if (credentials) references.push(credentials)

  for (const { secret } of variables) {
    // a key the workload starts without is not one the cluster has to hold
    if (secret === undefined || secret.optional === true) continue

    const reference = `${secret.name}/${secret.key}`

    if (!references.includes(reference)) references.push(reference)
  }

  return references
}

/**
 * @param {toa.operations.Process} process
 * @param {string[]} references
 * @param {toa.deployment.installation.Options} options
 * @returns {Promise<void>}
 */
export async function verify(process, references, options) {
  if (references.length === 0) return

  const deployed = await read(process, options)
  const missing = references.filter((reference) => !deployed.has(reference))

  if (missing.length > 0)
    throw new Error(`Secrets are not deployed: ${missing.join(', ')}`)
}

/**
 * What the namespace holds, as the names of its secrets and the `<name>/<key>` of every key in
 * them. The namespace is read whole: a call per secret would be a process per secret, and the
 * wrapper for a single one cannot tell a secret that is absent from a cluster that cannot be
 * reached — which a preflight is the worst place to guess at. Listing asks no permission a
 * deploy does not already have, Helm keeping its own release state in secrets of this namespace.
 *
 * Only the keys are read. What is under them is the cluster's and stays there.
 *
 * @param {toa.operations.Process} process
 * @param {toa.deployment.installation.Options} options
 * @returns {Promise<Set<string>>}
 */
async function read(process, options) {
  const args = ['get', 'secrets', '-o', TEMPLATE]

  if (options.namespace !== undefined) args.push('-n', options.namespace)

  const output = await process.execute('kubectl', args, { silently: true })

  /** @type {Set<string>} */
  const deployed = new Set()

  for (const line of output.split('\n')) {
    if (line === '') continue

    const [name, ...keys] = line.split(' ')

    deployed.add(name)

    for (const key of keys) deployed.add(`${name}/${key}`)
  }

  return deployed
}

/** A secret's name and the keys in it, one secret a line. Neither may hold a space. */
const TEMPLATE =
  'go-template={{range .items}}{{.metadata.name}}' +
  '{{range $key, $value := .data}} {{$key}}{{end}}{{"\\n"}}{{end}}'
