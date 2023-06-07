import { generate } from "randomstring"
import type { Manifest } from "@toa.io/norm"

export function manifest (): Partial<Manifest> {
  return {
    name: generate(),
    operations: {
      observe: {
        type: 'observation'
      },
      transit: {
        type: 'transition'
      }
    }
  }
}
