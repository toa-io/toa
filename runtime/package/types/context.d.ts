export namespace toa.package {
    interface Dependency extends Object {}

    interface DependencyMap {
        [key: string]: Dependency
    }

    interface Context {
        connectors?: DependencyMap,
        extensions?: DependencyMap
    }
}
