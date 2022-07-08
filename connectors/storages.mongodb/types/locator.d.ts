declare namespace toa.storages.mongo {

    interface Locator {
        href: string
        hostname: string
        db: string
        collection: string
    }

}
