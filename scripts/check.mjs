import { execFileSync } from 'node:child_process'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

const files = [...walk('src'), ...walk('scripts'), ...walk('tests')]
  .filter((path) => path.endsWith('.js') || path.endsWith('.mjs'))
  .filter((path) => !path.endsWith('check.mjs'))

for (const file of files) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' })
console.log(`syntax check passed: ${files.length} files`)
