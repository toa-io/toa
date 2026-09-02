import { origin } from '@/net'
import { consume } from './svc/transfer'
import { sync } from './svc/sync'
import { challenge } from './svc/store'

function rc() {
  origin.events.on('challenge', (value) => challenge.set(value))

  origin.events.on('error', (error) => {
    if (error.code === 401) challenge.set(null)
  })

  challenge.subscribe((challenge) => origin.authenticate(challenge))

  const transferred = consume()

  if (transferred !== null) challenge.set(transferred)

  void sync()
}

export { rc }
