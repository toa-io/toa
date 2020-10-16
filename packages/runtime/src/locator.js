const TLD = 'facility';

class Locator {

    constructor(domain, name) {
        this.domain = domain;
        this.name = name;
        this.label = `${domain}${name ? `.${name}` : ''}`;
    }

    host(type) {
        return [this.domain, type, TLD].join('.');
    }

}

module.exports = Locator;
