import type { ClassValue, HTMLAttributes } from 'svelte/elements'

export interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class'> {
  class?: ClassValue
}
