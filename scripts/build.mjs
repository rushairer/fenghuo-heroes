import { cpSync, mkdirSync, rmSync } from 'node:fs'

rmSync('dist', { recursive: true, force: true })
mkdirSync('dist', { recursive: true })
cpSync('index.html', 'dist/index.html')
cpSync('styles.css', 'dist/styles.css')
cpSync('src', 'dist/src', { recursive: true })
cpSync('public', 'dist', { recursive: true })
console.log('built static GitHub Pages artifact in dist/')
