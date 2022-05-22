declare namespace toa.storages.mongo {

    interface Locator extends URL {
        db: string
        collection: string
    }

}
