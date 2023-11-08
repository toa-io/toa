import { join, sep } from 'node:path/posix'
import { tmpdir } from 'node:os'
import { mkdtemp, copy } from 'fs-extra'
import * as yaml from '@toa.io/yaml'

export class Workspace {
  private root: string = devnull

  public static exists
  (_0: unknown, _1: unknown, descriptor: PropertyDescriptor): PropertyDescriptor {
    const method = descriptor.value

    descriptor.value = async function (this: Workspace, ...args: any[]): Promise<any> {
      if (this.root === devnull) this.root = await mkdtemp(tmpdir() + sep)

      return method.apply(this, args)
    }

    return descriptor
  }

  @Workspace.exists
  public async addComponent (name: string, patch?: object): Promise<string> {
    const source = join(__dirname, 'components', name)
    const target = join(this.root, name)

    await copy(source, target)

    if (patch !== undefined)
      await this.patchManifest(target, patch)

    return target
  }

  private async patchManifest (target: string, patch: object): Promise<void> {
    const path = join(target, 'manifest.toa.yaml')

    await yaml.patch(path, patch)
  }
}

const devnull = '/dev/null'
