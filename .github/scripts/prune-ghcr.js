import { execFileSync } from 'node:child_process'

const ORG = 'toa-io'

const PACKAGES = [
  'runtime',
  'extension-exposition-gateway',
  'extension-realtime-streams',
  'extension-introspection-explorer',
  'extension-configuration-values'
]

/** A prerelease among the 30 newest, or younger than this, stays. */
const KEEP = 30
const TTL = 90 * 24 * 60 * 60 * 1000

/**
 * Untagged versions go immediately. `:alpha`, `:latest`, and a version without a
 * pre-release suffix stay. A prerelease stays if it is among the 30 newest or
 * younger than 90 days.
 *
 * @param {object[]} versions
 * @param {number} [now]
 * @returns {number[]}
 */
export function doomed(versions, now = Date.now()) {
  const ids = []
  const ranked = []

  for (const version of versions) {
    const tags = version.metadata?.container?.tags ?? []

    if (tags.some(kept)) continue

    if (tags.length === 0) {
      ids.push(version.id)
      continue
    }

    ranked.push(version)
  }

  ranked.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))

  for (const [index, version] of ranked.entries()) {
    if (index < KEEP) continue

    if (now - Date.parse(version.created_at) <= TTL) continue

    ids.push(version.id)
  }

  return ids
}

/** @param {string} tag */
function kept(tag) {
  return tag === 'alpha' || tag === 'latest' || /^\d+\.\d+\.\d+$/.test(tag)
}

function api(path, method = 'GET') {
  const args = ['api', '-H', 'Accept: application/vnd.github+json', '-X', method]

  if (method === 'GET') args.push('--paginate')

  args.push(path)

  const stdout = execFileSync('gh', args, { encoding: 'utf8' }).trim()

  if (stdout === '') return null

  return JSON.parse(stdout)
}

function versions(name) {
  try {
    return (
      api(`/orgs/${ORG}/packages/container/${encodeURIComponent(name)}/versions`) ?? []
    )
  } catch (error) {
    const output = [error.stderr, error.stdout, error.message].join(' ')

    if (output.includes('404')) return []

    throw error
  }
}

function drop(name, id) {
  api(
    `/orgs/${ORG}/packages/container/${encodeURIComponent(name)}/versions/${id}`,
    'DELETE'
  )
}

export function prune() {
  for (const name of PACKAGES) {
    const ids = doomed(versions(name))

    console.log(`${name}: deleting ${ids.length} version(s)`)

    for (const id of ids) drop(name, id)
  }
}

if (import.meta.main) prune()
