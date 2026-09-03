/**
 * Quotes a value for an RSQL criteria expression, so that the value carries no grammar:
 * `,` `;` `(` `)` `=` and quotes inside it are read as characters.
 *
 * @param {string} value
 * @returns {string}
 */
export const quote = (value) => '"' + value.replace(/["\\]/g, '\\$&') + '"'
