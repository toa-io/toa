module.exports = class {

    constructor(pubs, transport) {
        this._pubs = pubs;
        this._transport = transport;

        for (const pub of this._pubs)
            this._transport.pubs(pub.name);
    }

    handle(before, after) {

        for (const pub of this._pubs) {
            const payload = pub.algorithm(before, after);

            if (payload instanceof Object)
                this._transport.emit(pub.name, payload);
        }

    }

};
