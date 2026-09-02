import type { Configuration } from '@/configuration'

export type ConfigurationLike = Pick<Configuration, 'component' | 'configuration' | 'schema'>

export interface Props {
  configuration: ConfigurationLike
}
