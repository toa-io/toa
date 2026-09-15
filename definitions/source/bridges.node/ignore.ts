/**
 * What a component's version is not made of.
 *
 * A component is built in more than one way — an image this runtime writes, a `Dockerfile` an
 * application keeps beside it — and a version is the same only where both hash the same files.
 * What no build ships, or what every build writes for itself, is left out here so that neither
 * has to say so.
 *
 * A component adds to this with `ignore`, and puts one of these back with `!`.
 */
export const ignore = [
  // installed dependencies: platform- and install-specific, and what they are is `package.json`
  '**/node_modules/**',

  // written by the install
  'package-lock.json',
  'npm-shrinkwrap.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lock*',

  // never shipped
  '**/.git/**',
  '**/.hg/**',
  '**/.svn/**',

  // left out of a build by convention
  '**/*.test.*',
  '**/*.spec.*',
  '**/__tests__/**',

  // Node loads none of them, and they are generated as often as not
  '**/*.d.ts',

  // they describe a build rather than the component
  '**/Dockerfile*',
  '**/.dockerignore',

  // what a tool wrote
  'coverage/**',
  '.nyc_output/**',
  '**/*.tsbuildinfo',
  '.cache/**',
  '**/*.log',

  // what a machine wrote
  '**/.DS_Store',
  '**/Thumbs.db',
  '**/*.swp',
  '.idea/**',
  '.vscode/**',

  // no component holds one, and what it holds differs everywhere
  '.env',
  '.env.*'
]
