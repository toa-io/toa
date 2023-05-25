'use strict'

/**
 * @param {string} input
 * @param {Record<string, string> | string[] | string} [argument]
 * @param {...string} [substitutions]
 * @returns {string}
 */
function echo (input, argument = process.env, ...substitutions) {
  if (typeof argument === 'string') return array(input, [argument, ...substitutions])
  else if (Array.isArray(argument)) return array(input, argument)
  else return object(input, /** @type {Record<string, string>} */ argument)
}

/**
 * @param {string} input
 * @param {Record<string, string>} [variables]
 * @returns {string}
 */
function object (input, variables) {
  return input.replaceAll(VARIABLE, (_, variable) => variables[variable] ?? '')
}

/**
 * @param {string} input
 * @param {string[]} [array]
 * @returns {string}
 */
function array (input, array) {
  return input.replaceAll(INDEX, (_, index) => array[+index] ?? '')
}

const VARIABLE = /\${([A-Za-z_]{0,32})}/g
const INDEX = /\{(\d)}/g

exports.echo = echo
