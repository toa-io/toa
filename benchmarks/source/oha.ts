import { spawn } from 'node:child_process'
import { args, read } from './load.ts'
import type { LoadOptions, LoadResult } from './load.ts'

export interface Target {
  /** the CPUs the load generator is pinned to */
  cpus: string | null
  /** the status every request must be answered with */
  status: number
  /** stops the load: a request nothing answers is waited for otherwise */
  signal?: AbortSignal
}

export async function send(options: LoadOptions, target: Target): Promise<LoadResult> {
  const argv = args(options)
  const [command, list] = target.cpus === null ? ['oha', argv] : ['taskset', ['-c', target.cpus, 'oha', ...argv]]
  const { code, stdout, stderr } = await execute(command, list, target.signal)

  if (code !== 0) throw new Error(`oha exited with ${code}: ${stderr.slice(0, 500)}`)

  try {
    return read(JSON.parse(stdout), target.status)
  } catch (error) {
    throw new Error(`${options.method} ${options.url}: ${error instanceof Error ? error.message : String(error)}`, {
      cause: error
    })
  }
}

export async function available(): Promise<void> {
  const { code } = await execute('oha', ['--version']).catch(() => ({ code: -1 }))

  if (code !== 0) throw new Error('oha is not on the PATH; see benchmarks/readme.md')
}

async function execute(
  command: string,
  argv: string[],
  signal?: AbortSignal
): Promise<{ code: number; stdout: string; stderr: string }> {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, argv, { stdio: ['ignore', 'pipe', 'pipe'], signal })
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []

    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk))
    child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk))
    child.on('error', reject)
    child.on('close', (code) =>
      resolve({
        code: code ?? -1,
        stdout: Buffer.concat(stdout).toString('utf8'),
        stderr: Buffer.concat(stderr).toString('utf8')
      })
    )
  })
}
