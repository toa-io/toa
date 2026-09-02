import { join } from 'node:path'
import { tmpdir, devNull } from 'node:os'
import { mkdtemp, cp, readFile, writeFile } from 'node:fs/promises'
import { load, dump } from 'js-yaml'
import { overwrite } from '@toa.io/generic'

export class Workspace {
  private root: string = devNull

  public static exists (_0: unknown, _1: unknown, descriptor: PropertyDescriptor): PropertyDescriptor {
    const method = descriptor.value

    descriptor.value = async function (this: Workspace, ...args: any[]): Promise<any> {
      if (this.root === devNull) this.root =
        await mkdtemp(join(tmpdir(), Math.random().toString(36).slice(2)))

      return method.apply(this, args)
    }

    return descriptor
  }

  @Workspace.exists
  public async addComponent (name: string, patch?: object): Promise<string> {
    const source = join(__dirname, 'components', name)
    const target = join(this.root, name)

    await cp(source, target, { force: true, recursive: true })

    if (patch !== undefined)
      await this.patchManifest(target, patch)

    return target
  }

  private async patchManifest (target: string, patch: object): Promise<void> {
    const path = join(target, 'manifest.toa.yaml')

    const manifest = load(await readFile(path, 'utf8')) as object

    overwrite(manifest, patch)

    await writeFile(path, dump(manifest, { noRefs: true, lineWidth: -1 }), 'utf8')
  }
}
