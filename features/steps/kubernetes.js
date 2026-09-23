import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { Given } from '@cucumber/cucumber'

const exec = promisify(execFile)

Given(
  'the namespace {label} holds no secrets',
  /**
   * The cluster `kubectl` is pointed at, as the deployment tooling reads it. The namespace is
   * the suite's own, and what it holds is the scenario's alone.
   *
   * @param {string} name
   */
  async function (name) {
    await create(name)

    await exec('kubectl', ['delete', 'secrets', '--all', '-n', name])
  }
)

/**
 * @param {string} name
 * @returns {Promise<void>}
 */
async function create(name) {
  try {
    await exec('kubectl', ['create', 'namespace', name])
  } catch (e) {
    if (!/already exists/.test(e.stderr ?? '')) throw e
  }
}
