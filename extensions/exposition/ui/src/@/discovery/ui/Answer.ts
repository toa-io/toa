import type { ClassValue } from 'svelte/elements'
import type { Answer } from '@/discovery'

export interface Props {
  of: Answer
  class?: ClassValue
}
