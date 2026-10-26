import type { Configuration } from '#/configuration/index.js'

export type ConfigurationLike = Pick<
  Configuration,
  'component' | 'configuration' | 'schema'
>

export interface Props {
  configuration: ConfigurationLike
}
