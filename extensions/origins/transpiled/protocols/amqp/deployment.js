'use strict';
const { letters: { up } } = require('@toa.io/generic');
const protocols = require('./protocols');
/**
 * @param {toa.norm.context.dependencies.Instance[]} instances
 * @returns {toa.deployment.dependency.Variables}
 */
function deployment(instances) {
    /** @type {toa.deployment.dependency.Variables} */
    const variables = {};
    for (const { locator, manifest } of instances) {
        const secrets = [];
        for (const [origin, reference] of Object.entries(manifest)) {
            let protocol;
            const match = reference.match(RX);
            if (match !== null)
                protocol = match.groups.protocol;
            if (protocols.includes(protocol)) {
                const originSecrets = createSecrets(locator, origin);
                secrets.push(...originSecrets);
            }
        }
        variables[locator.label] = secrets;
    }
    return variables;
}
/**
 * @param {toa.core.Locator} locator
 * @param {string} origin
 * @return {toa.deployment.dependency.Variable[]}
 */
function createSecrets(locator, origin) {
    const properties = ['username', 'password'];
    return properties.map((property) => createSecret(locator, origin, property));
}
/**
 * @param {toa.core.Locator} locator
 * @param {string} origin
 * @param {string} property
 * @return {toa.deployment.dependency.Variable}
 */
function createSecret(locator, origin, property) {
    const variable = `TOA_ORIGINS_${locator.uppercase}_${up(origin)}_${up(property)}`;
    const secret = `toa-origins-${locator.label}-${origin}`;
    return {
        name: variable,
        secret: {
            name: secret,
            key: property
        }
    };
}
const RX = /^(?<protocol>\w{1,12}:)/;
exports.deployment = deployment;
//# sourceMappingURL=deployment.js.map