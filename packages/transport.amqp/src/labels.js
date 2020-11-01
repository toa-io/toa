const SEPARATOR = '..';

const request = (label) => `request.${label}`;
const reply = (label, caller, suffix) => {
    const parts = [`reply.${label}`];

    if (caller)
        parts.push(caller);

    if (suffix)
        parts.push(suffix);

    return parts.join(SEPARATOR);
};

const key = (caller, suffix) => `${caller}.${suffix}`;

const pub = (caller, label) => `event.${caller}.${label}`;
const sub = (label, target) =>  {
    const parts = [`event.${label}`]

    if (target)
        parts.push(target);

    return parts.join(SEPARATOR);
};

module.exports = { pub, sub, request, reply, key };
