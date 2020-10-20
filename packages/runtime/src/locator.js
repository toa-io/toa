const TLD = 'facility';

class Locator {

    constructor(manifest) {
        this.domain = manifest.domain;
        this.name = manifest.state?.name;
        this.label = `${this.domain}${this.name ? `.${this.name}` : ''}`;
    }

    host(type) {
        return [this.domain, type, TLD].join('.');
    }

}

module.exports = Locator;
