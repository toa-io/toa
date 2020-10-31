const request = (label) => `request.${label}`;
const reply = (label, caller, suffix) => {
    const parts = [`reply.${label}`];

    if (caller)
        parts.push(caller);

    if (suffix)
        parts.push(suffix);

    return parts.join('..');
};

const key = (caller, suffix) => `${caller}.${suffix}`;

module.exports = { request, reply, key };
