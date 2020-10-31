const TLD = 'facility';

class Locator {

    constructor(manifest) {
        this.domain = manifest.domain;
        this.name = manifest.name || manifest.state?.name || manifest.domain;
        this.label = `${this.domain}${this.name && this.name !== this.domain ? `.${this.name}` : ''}`;
        this.transport = manifest.transport;
    }

    host(type) {
        return [this.domain, type, TLD].join('.');
    }

}

module.exports = Locator;
