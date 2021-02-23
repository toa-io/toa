import load from './load'

export default class Package {
  /**
   * @param dir {string} Component path
   * @param [options] {Object} Options object
   * @param [options.manifestFile=kookaburra.yaml] {string} Manifest file name
   * @param [options.operationsPath='./operations'] {string} Operations dir
   * @returns {Promise<Package>}
   */
  static async load (dir, options) {
    const { manifest, operations } = await load(dir, options)

    const component = new Package()

    component.manifest = manifest
    component.operations = operations

    return component
  }

  manifest
  operations
}
