#!/usr/bin/env node

import { spawn } from 'child_process'

spawn('npx', ['shadcn-svelte', 'add', ...process.argv.slice(2)], {
  stdio: 'inherit',
})
