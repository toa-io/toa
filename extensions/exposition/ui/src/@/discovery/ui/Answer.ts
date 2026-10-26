import type { ClassValue } from 'svelte/elements'
import type { Answer } from '#/discovery/index.js'

export interface Props {
  of: Answer
  class?: ClassValue
}
