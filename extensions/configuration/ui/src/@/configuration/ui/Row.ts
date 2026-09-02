import type { ClassValue } from 'svelte/elements'
import type { Configuration } from '@/configuration'

export type ConfigurationLike = Pick<Configuration, 'id' | 'component' | 'configuration'>

export interface Props {
  configuration: ConfigurationLike
  class?: ClassValue
}
