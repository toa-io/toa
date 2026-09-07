import { kubernetes } from '@toa.io/operations'
import { PREFIX } from './conceal.js'

const { secrets } = kubernetes

export const reveal = async (argv) => {
  const prefixed = PREFIX + argv.secret
  const data = await secrets.get(prefixed)

  if (data === null) return

  for (const [key, value] of Object.entries(data)) {
    const line = `${key}: ${value}`

    console.log(line)
  }
}
