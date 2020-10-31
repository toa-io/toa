module.exports = class Call {

    constructor(endpoint, transport) {
        this.endpoint = endpoint;
        this._transport = transport;

        transporter.calls(endpoint.label, true);
    }

    async invoke(io, query) {
        const response = await this._transport.request(this.endpoint.label, { input: io.input, query });

        if (response.error)
            Object.assign(io.error, response.error);

        if (response.output)
            Object.assign(io.output, response.output);
    }

}
