/*
 * Named `.mts` so that the suite, which imports every `.ts` under `features`, does not run it.
 * A replica of the realtime service in a process of its own: the in-process binding admits one
 * composition of a component per process, and a replica is what another process runs anyway.
 * The scenario's process tells it what to call over IPC.
 */
import * as boot from '@toa.io/boot'
import { Locator } from '@toa.io/core'
import { resolve } from 'node:path'
import { Factory } from '../../source/index.ts'

// what a deployment's component map states of the component whose events it routes
const messages = await boot.manifest(resolve(import.meta.dirname, 'components/messages'))

await boot.map.compose([messages])

const service = await new Factory(boot.host()).service()

await service.connect()

const streams = await boot.remote(new Locator('streams', 'realtime'))

await streams.connect()

process.on('message', (message: Message) => {
  void (async () => {
    if (message.command === 'stop') {
      await streams.disconnect()
      await service.disconnect()
      process.exit(0)
    }

    try {
      const reply: unknown = await streams.invoke(message.command, {
        input: message.input
      })

      process.send!({ reply: reply ?? null })
    } catch (error) {
      process.send!({ exception: String((error as Error).message ?? error) })
    }
  })()
})

process.send!({ ready: true })

interface Message {
  command: string
  input?: unknown
}
