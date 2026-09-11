import { readFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'
import type { CpuProfile } from './profile.ts'

/**
 * The V8 profiler of a running process, over the inspector protocol. Profiling this way starts
 * and stops where the measured window does, so boot, seeding and warm-up stay out of it.
 */
export class Profiler {
  private readonly socket: WebSocket
  private readonly pending = new Map<number, { resolve: (result: any) => void; reject: (error: Error) => void }>()
  private next = 1

  private constructor(socket: WebSocket) {
    this.socket = socket

    socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data)) as { id?: number; result?: unknown; error?: { message: string } }

      if (message.id === undefined) return

      const pending = this.pending.get(message.id)

      this.pending.delete(message.id)

      if (message.error === undefined) pending?.resolve(message.result)
      else pending?.reject(new Error(message.error.message))
    })
  }

  /** Connects to the inspector the process announced in its log. */
  public static async attach(log: string): Promise<Profiler> {
    const address = await announced(log)
    const socket = new WebSocket(address)

    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true })
      socket.addEventListener('error', () => reject(new Error(`Inspector at ${address} refused`)), { once: true })
    })

    return new Profiler(socket)
  }

  public async start(): Promise<void> {
    await this.send('Profiler.enable')
    await this.send('Profiler.start')
  }

  public async stop(): Promise<CpuProfile> {
    const { profile } = (await this.send('Profiler.stop')) as { profile: CpuProfile }

    return profile
  }

  public close(): void {
    this.socket.close()
  }

  private async send(method: string, params?: object): Promise<unknown> {
    const id = this.next++

    return await new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }
}

async function announced(log: string): Promise<string> {
  for (let attempt = 0; attempt < 100; attempt++) {
    // a log is appended to by every boot of its process, so the address is the latest one
    const match = [...readFileSync(log, 'utf8').matchAll(/Debugger listening on (ws:\/\/\S+)/g)].at(-1)

    if (match !== undefined) return match[1]

    await sleep(100)
  }

  throw new Error(`No inspector address in ${log}`)
}
