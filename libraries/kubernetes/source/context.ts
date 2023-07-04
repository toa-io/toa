import { $ } from '@toa.io/command'

export async function get (): Promise<string> {
  const { stdout } = await $`kubectx -c`

  return stdout
}

export async function set (name: string): Promise<void> {
  await $`kubectx ${name}`
}
