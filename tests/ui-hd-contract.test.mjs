import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
const scenesDir=new URL('../src/scenes/',import.meta.url)

function sceneSources(){
  return readdirSync(scenesDir)
    .filter((name)=>name.endsWith('.js'))
    .map((name)=>({
      name,
      source:readFileSync(new URL(name,scenesDir),'utf8'),
    }))
}

test('reusable UI panels and frames may not bypass the nine-slice HD gate',()=>{
  const failures=[]
  const forbidden=/assets\?\.get\(['"]ui\.(?:panels|frames)\./g
  for(const {name,source} of sceneSources()){
    const matches=[...source.matchAll(forbidden)]
    if(matches.length)failures.push(`${name}: ${matches.length} raw reusable UI lookup(s)`)
  }
  assert.deepEqual(failures,[])
})

test('scene code never directly stretches reusable panel/frame assets',()=>{
  const failures=[]
  for(const {name,source} of sceneSources()){
    if(/drawImage(?:Stretch|Cover|Centered)\([^\n]*ui\.(?:panels|frames)/.test(source)){
      failures.push(name)
    }
  }
  assert.deepEqual(failures,[])
})


test('scene visual assets may not bypass explicit HD-aware registry lookups',()=>{
  const failures=[]
  for(const {name,source} of sceneSources()){
    const raw=[...source.matchAll(/assets(?:\?\.|\.)get\(/g)]
    if(raw.length)failures.push(`${name}: ${raw.length} raw asset lookup(s)`)
  }
  assert.deepEqual(failures,[])
})
