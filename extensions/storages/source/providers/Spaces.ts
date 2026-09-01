import { S3 } from './S3'
import type { Secret, Secrets } from '../Secrets'

export interface SpacesOptions {
  space: string
  region: string
}

type SpacesSecrets = Secrets<'ACCESS_KEY_ID' | 'SECRET_ACCESS_KEY'>

export class Spaces extends S3 {
  public static override readonly SECRETS: readonly Secret[] = [
    { name: 'ACCESS_KEY_ID' },
    { name: 'SECRET_ACCESS_KEY' }
  ]

  public constructor (options: SpacesOptions, secrets?: SpacesSecrets) {
    super({
      bucket: options.space,
      region: options.region,
      endpoint: `https://${options.region}.digitaloceanspaces.com`
    }, secrets)
  }
}
