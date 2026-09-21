import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { RUNTIME_SCAFFOLD_CITIES } from '../src/game/runtime-map-scaffold.js'

function walk(dir){
  return readdirSync(dir).flatMap((name)=>{
    const path=join(dir,name)
    return statSync(path).isDirectory()?walk(path):[path]
  })
}

test('runtime consumers do not hardcode provisional scaffold city ids',()=>{
  const ids=RUNTIME_SCAFFOLD_CITIES.map((city)=>city.id)
  const failures=[]
  for(const path of [...walk('src/game'),...walk('src/scenes')]){
    if(!path.endsWith('.js'))continue
    if(path.endsWith('runtime-map-scaffold.js'))continue
    const source=readFileSync(path,'utf8')
    for(const id of ids){
      if(source.includes(`'${id}'`)||source.includes(`"${id}"`)){
        failures.push(`${path}: ${id}`)
      }
    }
  }
  assert.deepEqual(failures,[])
})
