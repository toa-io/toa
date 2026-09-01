import { promisify } from 'node:util'
import { exec as execute } from 'node:child_process'

const exec = promisify(execute)

export async function get (): Promise<string> {
  const { stdout } = await exec('kubectx -c')

  return stdout
}

export async function set (name: string): Promise<void> {
  await exec(`kubectx ${name}`)
}
