class Endpoint {

    constructor(locator, name) {
        this.locator = locator;
        this.name = name;

        this.label = `${locator.label}.${name}`;
    }

}

module.exports = Endpoint;
