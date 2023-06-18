import { join } from 'node:path'
import { binding } from 'cucumber-tsflow'
import { directory } from '@toa.io/filesystem'
import * as yaml from '@toa.io/yaml'

@binding()
export class Workspace {
  private root: string = ''

  public static exists
  (target: Workspace, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const method = descriptor.value

    descriptor.value = async function (this: Workspace, ...args: any[]): Promise<any> {
      if (this.root === '') this.root = await directory.temp()

      return method.apply(this, args)
    }

    return descriptor
  }

  @Workspace.exists
  public async addComponent (name: string, patch?: object): Promise<string> {
    const source = join(__dirname, 'components', name)
    const target = join(this.root, name)

    await directory.copy(source, target)

    if (patch !== undefined) await this.patchManifest(target, patch)

    return target
  }

  private async patchManifest (target: string, patch: object): Promise<void> {
    const path = join(target, 'manifest.toa.yaml')

    await yaml.patch(path, patch)
  }
}
