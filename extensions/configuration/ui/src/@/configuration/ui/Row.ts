import type { ClassValue } from 'svelte/elements'
import type { Configuration } from '#/configuration/index.js'

export type ConfigurationLike = Pick<
  Configuration,
  'id' | 'component' | 'configuration' | 'revision'
>

export interface Props {
  configuration: ConfigurationLike
  class?: ClassValue
}
