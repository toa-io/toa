import assert from 'node:assert'
import { relative, resolve } from 'node:path'
import { mkdir, readdir, readFile } from 'node:fs/promises'
import { glob } from 'tinyglobby'
import { Given, Then } from '@cucumber/cucumber'

Given(
  'my working directory is {path}',
  /**
   * @param {string} path
   * @this {toa.features.Context}
   */
  async function (path) {
    let target

    if (path.substring(0, 4) === '/toa') target = toa(path)
    else target = await pattern(this.cwd, path)

    process.chdir(target)

    this.cwd = target
  }
)

Given(
  'I have a directory {path}',
  /**
   * @param {string} path
   * @this {toa.features.Context}
   */
  async function (path) {
    await mkdir(resolve(this.cwd, path), { recursive: true })
  }
)

Then(
  'no file under {path} contains {string}',
  /**
   * What is written from a template has every value it was to be given.
   *
   * @param {string} target
   * @param {string} text
   * @this {toa.features.Context}
   */
  async function (target, text) {
    const root = resolve(this.cwd, target)
    const entries = await readdir(root, { recursive: true, withFileTypes: true })
    const files = entries.filter((entry) => entry.isFile())

    assert.ok(files.length > 0, `'${target}' holds no files`)

    for (const entry of files) {
      const path = resolve(entry.parentPath, entry.name)
      const contents = await readFile(path, 'utf8')

      assert.equal(contents.includes(text), false, `'${relative(root, path)}' contains '${text}'`)
    }
  }
)

Then(
  'the file {path} contains exact line {string}',
  /**
   * @param {string} relative
   * @param {string} line
   * @this {toa.features.Context}
   */
  async function (relative, line) {
    const lines = await read.call(this, relative)
    const found = lines.some((item) => item === line)

    assert.equal(found, true, `Line '${line}' not found in '${relative}'`)
  }
)

Then(
  'there is no file {path}',
  /**
   * @param {string} relative
   * @this {toa.features.Context}
   */
  async function (relative) {
    const paths = await glob(resolve(this.cwd, relative), FILES)

    assert.deepEqual(paths, [], `'${relative}' matches ${paths.length} file(s)`)
  }
)

Then(
  'the file {path} contains line starting with {string}',
  /**
   * @param {string} relative
   * @param {string} prefix
   * @this {toa.features.Context}
   */
  async function (relative, prefix) {
    const lines = await read.call(this, relative)
    const found = lines.some((item) => item.startsWith(prefix))

    assert.equal(found, true, `Line starting with '${prefix}' not found in '${relative}'`)
  }
)

Then(
  'the file {path} contains {int} distinct line(s)',
  /**
   * What wrote the file is more than one of something — a process, a replica — and the lines
   * say which; how many times each wrote is not the point.
   *
   * @param {string} relative
   * @param {number} count
   * @this {toa.features.Context}
   */
  async function (relative, count) {
    const lines = await read.call(this, relative)
    const distinct = new Set(lines.filter((line) => line !== ''))

    assert.equal(
      distinct.size,
      count,
      `'${relative}' holds ${distinct.size} distinct line(s): ${[...distinct].join(', ')}`
    )
  }
)

Then(
  'the file {path} contains no repeated lines',
  /**
   * What wrote the file is more than one of something, and each line is a thing only one of
   * them should have done.
   *
   * @param {string} relative
   * @this {toa.features.Context}
   */
  async function (relative) {
    const lines = (await read.call(this, relative)).filter((line) => line !== '')
    const repeated = lines.filter((line, index) => lines.indexOf(line) !== index)

    assert.ok(lines.length > 0, `'${relative}' holds no lines`)
    assert.deepEqual(repeated, [], `'${relative}' repeats: ${repeated.join(', ')}`)
  }
)

Then(
  'nothing under {path} is a link',
  /**
   * What a build context holds is files: a link in one points out of the directory it was
   * copied from, and the image it is built into has nothing where it points.
   *
   * @param {string} target
   * @this {toa.features.Context}
   */
  async function (target) {
    const root = await pattern(this.cwd, target)
    const entries = await readdir(root, { recursive: true, withFileTypes: true })

    const links = entries
      .filter((entry) => entry.isSymbolicLink())
      .map((entry) => relative(root, resolve(entry.parentPath, entry.name)))

    assert.deepEqual(links, [], `'${target}' holds ${links.length} link(s)`)
  }
)

/**
 * @param {string} relative
 * @this {toa.features.Context}
 * @return {Promise<string[]>}
 */
async function read(relative) {
  const pattern = resolve(this.cwd, relative)
  const paths = await glob(pattern, FILES)

  check(paths)

  return (await readFile(paths[0], 'utf8')).split('\n')
}

/**
 * @param {string} cwd
 * @param {string} path
 * @return {Promise<string>}
 */
async function pattern(cwd, path) {
  const pattern = resolve(cwd, path)
  const paths = await glob(pattern, DIRECTORIES)

  check(paths)

  // a directory is answered with the separator that ends it
  return paths[0].slice(0, -1)
}

/**
 * @param {string[]} paths
 */
const check = (paths) => {
  assert.equal(paths.length > 1, false, 'Ambiguous pattern')
  assert.equal(paths.length === 0, false, 'File not found')
}

/**
 * @param {string} path
 * @returns {string}
 */
const toa = (path) => {
  const relative = path.substring(5)

  return resolve(ROOT, relative)
}

const ROOT = resolve(import.meta.dirname, '../../')

const FILES = { onlyFiles: true, absolute: true, expandDirectories: false }
const DIRECTORIES = { onlyDirectories: true, absolute: true, expandDirectories: false }
