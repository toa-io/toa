const TLD = 'facility';

class Locator {

    constructor(manifest) {
        this.domain = manifest.domain;
        this.name = manifest.name || manifest.state?.name;
        this.label = `${this.domain}${this.name && this.name !== this.domain ? `.${this.name}` : ''}`;

        if (!this.name)
            throw new Error('Either component name or state name must be provided');
    }

    host(type) {
        return [this.domain, type, TLD].join('.');
    }

}

module.exports = Locator;
