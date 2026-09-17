import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, rmSync } from 'node:fs'

rmSync('dist', { recursive: true, force: true })
mkdirSync('dist', { recursive: true })
cpSync('index.html', 'dist/index.html')
cpSync('styles.css', 'dist/styles.css')
cpSync('src', 'dist/src', { recursive: true })
cpSync('public', 'dist', { recursive: true })
execFileSync(process.execPath,['scripts/materialize-generated-assets.mjs','dist'],{stdio:'inherit'})
rmSync('dist/assets/generated',{recursive:true,force:true})
console.log('built static GitHub Pages artifact in dist/')
