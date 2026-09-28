import { execFileSync } from 'node:child_process'
import { git } from './trees.ts'

/** A pull request a run compares and reports to. */
export interface Pull {
  number: string
  /** the commit the pull request stands at when the run starts */
  head: string
  /** the branch the pull request goes into */
  into: string
  /** the merge base of the head with that branch */
  base: string
}

/**
 * Both revisions are commits, fetched from the remote, so the run is of what the pull request
 * holds whatever the checkout is doing meanwhile.
 */
export function pull(repository: string, number: string): Pull {
  const { headRefOid, baseRefName } = JSON.parse(
    gh(repository, ['pr', 'view', number, '--json', 'headRefOid,baseRefName'])
  ) as { headRefOid: string; baseRefName: string }

  git(repository, 'fetch', '-q', 'origin', baseRefName, `refs/pull/${number}/head`)

  const base = git(repository, 'merge-base', headRefOid, `origin/${baseRefName}`)

  return { number, head: headRefOid, into: baseRefName, base }
}

export function post(repository: string, pull: Pull, body: string): void {
  gh(repository, ['pr', 'comment', pull.number, '--body-file', '-'], body)
}

export function failure(pull: Pull, message: string): string {
  return `# Benchmark\n\nThe run of \`${pull.head.slice(0, 7)}\` against \`${pull.base.slice(0, 7)}\` failed:\n\n\`\`\`\n${message}\n\`\`\`\n`
}

function gh(repository: string, args: string[], input?: string): string {
  return execFileSync('gh', args, { cwd: repository, encoding: 'utf8', input }).trim()
}
