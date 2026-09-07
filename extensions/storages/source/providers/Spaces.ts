import { S3 } from './S3.js'
import { secrets } from './secrets.js'
import type { Secret, Secrets } from '../Secrets.js'

export interface SpacesOptions {
  space: string
  region: string
}

type SpacesSecrets = Secrets<'ACCESS_KEY_ID' | 'SECRET_ACCESS_KEY'>

export class Spaces extends S3 {
  public static override readonly SECRETS: readonly Secret[] = secrets.spaces

  public constructor(options: SpacesOptions, secrets?: SpacesSecrets) {
    super(
      {
        bucket: options.space,
        region: options.region,
        endpoint: `https://${options.region}.digitaloceanspaces.com`
      },
      secrets
    )
  }
}
